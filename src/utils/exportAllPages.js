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

        const dataUrl = await toPng(exportRef.current, {
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
        });

        const link = document.createElement("a");

        link.download =
            `vod-review-${safePlayer}-` +
            `${safeHero}-page-${activePageIndex + 1}.png`;

        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error("PNG export failed:", error);
        alert("PNG export failed. Check console for details.");
    } finally {
        uiState.setGridEnabled(wasGridEnabled);
        uiState.setLockToRegions(wasLockToRegions);
        uiState.setIsExporting(false);
    }
}
