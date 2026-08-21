import { toPng } from "html-to-image";

export async function exportAllPages({
    pages,
    activePageId,
    exportRef,
    form,
    uiState,
    deselectAll,
    PAGE_W,
    PAGE_H,
}) {
    if (!exportRef.current) {
        alert("Export canvas not found.");
        return;
    }

    const wasGridEnabled = uiState.gridEnabled;
    const wasLockToRegions = uiState.lockToRegions;
    const activePageIndex = Math.max(
        0,
        pages.findIndex((page) => page.id === activePageId)
    );

    try {
        uiState.setIsExporting(true);
        uiState.setGridEnabled(false);
        uiState.setLockToRegions(false);

        deselectAll();

        const safeHero = (form.hero || "hero")
            .replace(/[^\w-]+/g, "-")
            .toLowerCase();

        const safePlayer = (form.player || "player")
            .replace(/[^\w-]+/g, "-")
            .toLowerCase();

        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => setTimeout(resolve, 50));

        const baseName = `vod-review-${safePlayer}-${safeHero}`;
        const exportOptions = getPngExportOptions(PAGE_W, PAGE_H);

        if (pages.length <= 1) {
            await waitForCanvasAssets(exportRef.current);
            const dataUrl = await toPng(exportRef.current, exportOptions);

            downloadUrl(dataUrl, `${baseName}-page-${activePageIndex + 1}.png`);
            return;
        }

        const pageNodes = Array.from(
            document.querySelectorAll(".print-pages .print-page .editor-canvas")
        );

        if (pageNodes.length !== pages.length) {
            throw new Error(`Expected ${pages.length} export pages, found ${pageNodes.length}.`);
        }

        const files = [];

        for (const [index, node] of pageNodes.entries()) {
            await waitForCanvasAssets(node);
            const dataUrl = await toPng(node, exportOptions);

            files.push({
                name: `${baseName}-page-${index + 1}.png`,
                data: dataUrlToBytes(dataUrl),
            });
        }

        downloadBlob(createZipBlob(files), `${baseName}-pages.zip`);
    } catch (error) {
        console.error("PNG export failed:", error);
        alert("PNG export failed. Check console (F12) for details.");
    } finally {
        uiState.setGridEnabled(wasGridEnabled);
        uiState.setLockToRegions(wasLockToRegions);
        uiState.setIsExporting(false);
    }
}

async function waitForCanvasAssets(node) {
    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    const images = Array.from(node.querySelectorAll("img"));
    await Promise.all(images.map(waitForImage));

    // Give the browser a paint after decoding before html-to-image clones the node.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function waitForImage(image) {
    if (!image.complete) {
        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`Timed out while loading export image: ${image.currentSrc || image.src}`));
            }, 15000);

            const cleanup = () => {
                clearTimeout(timeoutId);
                image.removeEventListener("load", handleLoad);
                image.removeEventListener("error", handleError);
            };
            const handleLoad = () => {
                cleanup();
                resolve();
            };
            const handleError = () => {
                cleanup();
                reject(new Error(`Could not load export image: ${image.currentSrc || image.src}`));
            };

            image.addEventListener("load", handleLoad, { once: true });
            image.addEventListener("error", handleError, { once: true });
        });
    }

    if (!image.naturalWidth) {
        throw new Error(`Export image has no decoded content: ${image.currentSrc || image.src}`);
    }

    if (typeof image.decode === "function") {
        await image.decode();
    }
}

function getPngExportOptions(PAGE_W, PAGE_H) {
    return {
        cacheBust: true,
        pixelRatio: 1,
        canvasWidth: PAGE_W,
        canvasHeight: PAGE_H,
        width: PAGE_W,
        height: PAGE_H,

        filter: (node) => {
            return !node.classList?.contains("no-export");
        },

        style: {
            width: `${PAGE_W}px`,
            height: `${PAGE_H}px`,
            borderRadius: "0px",
            boxShadow: "none",
            outline: "none",
            transform: "none",
        },
    };
}

function downloadUrl(url, filename) {
    const link = document.createElement("a");

    link.download = filename;
    link.href = url;
    link.click();
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);

    try {
        downloadUrl(url, filename);
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
}

function createZipBlob(files) {
    const encoder = new TextEncoder();
    const chunks = [];
    const centralDirectory = [];
    let offset = 0;

    for (const file of files) {
        const nameBytes = encoder.encode(file.name);
        const crc = crc32(file.data);
        const localHeader = createLocalFileHeader(nameBytes, file.data.length, crc);

        chunks.push(localHeader, nameBytes, file.data);
        centralDirectory.push({
            nameBytes,
            size: file.data.length,
            crc,
            offset,
        });

        offset += localHeader.length + nameBytes.length + file.data.length;
    }

    const centralDirectoryStart = offset;

    for (const entry of centralDirectory) {
        const header = createCentralDirectoryHeader(entry);

        chunks.push(header, entry.nameBytes);
        offset += header.length + entry.nameBytes.length;
    }

    chunks.push(createEndOfCentralDirectoryRecord(
        centralDirectory.length,
        offset - centralDirectoryStart,
        centralDirectoryStart
    ));

    return new Blob(chunks, { type: "application/zip" });
}

function createLocalFileHeader(nameBytes, size, crc) {
    const view = new DataView(new ArrayBuffer(30));

    writeUint32(view, 0, 0x04034b50);
    writeUint16(view, 4, 20);
    writeUint16(view, 6, 0);
    writeUint16(view, 8, 0);
    writeUint16(view, 10, 0);
    writeUint16(view, 12, 0);
    writeUint32(view, 14, crc);
    writeUint32(view, 18, size);
    writeUint32(view, 22, size);
    writeUint16(view, 26, nameBytes.length);
    writeUint16(view, 28, 0);

    return new Uint8Array(view.buffer);
}

function createCentralDirectoryHeader(entry) {
    const view = new DataView(new ArrayBuffer(46));

    writeUint32(view, 0, 0x02014b50);
    writeUint16(view, 4, 20);
    writeUint16(view, 6, 20);
    writeUint16(view, 8, 0);
    writeUint16(view, 10, 0);
    writeUint16(view, 12, 0);
    writeUint16(view, 14, 0);
    writeUint32(view, 16, entry.crc);
    writeUint32(view, 20, entry.size);
    writeUint32(view, 24, entry.size);
    writeUint16(view, 28, entry.nameBytes.length);
    writeUint16(view, 30, 0);
    writeUint16(view, 32, 0);
    writeUint16(view, 34, 0);
    writeUint16(view, 36, 0);
    writeUint32(view, 38, 0);
    writeUint32(view, 42, entry.offset);

    return new Uint8Array(view.buffer);
}

function createEndOfCentralDirectoryRecord(entryCount, centralDirectorySize, centralDirectoryStart) {
    const view = new DataView(new ArrayBuffer(22));

    writeUint32(view, 0, 0x06054b50);
    writeUint16(view, 4, 0);
    writeUint16(view, 6, 0);
    writeUint16(view, 8, entryCount);
    writeUint16(view, 10, entryCount);
    writeUint32(view, 12, centralDirectorySize);
    writeUint32(view, 16, centralDirectoryStart);
    writeUint16(view, 20, 0);

    return new Uint8Array(view.buffer);
}

function writeUint16(view, offset, value) {
    view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
    view.setUint32(offset, value >>> 0, true);
}

function crc32(bytes) {
    let crc = 0xffffffff;

    for (const byte of bytes) {
        crc ^= byte;

        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    }

    return (crc ^ 0xffffffff) >>> 0;
}
