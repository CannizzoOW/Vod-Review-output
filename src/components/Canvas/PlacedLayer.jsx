import { useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PAGE_W, PAGE_H } from "../../utils/constants.js";
import { renderShapeLayer } from "../../utils/shapeRenderer.js";

const MIN_LAYER_W = 60;
const MIN_LAYER_H = 40;

const RESIZE_HANDLES = [
  { id: "n", className: "left-1/2 top-0 h-2 w-5 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize" },
  { id: "s", className: "bottom-0 left-1/2 h-2 w-5 -translate-x-1/2 translate-y-1/2 cursor-ns-resize" },
  { id: "e", className: "right-0 top-1/2 h-5 w-2 -translate-y-1/2 translate-x-1/2 cursor-ew-resize" },
  { id: "w", className: "left-0 top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
  { id: "ne", className: "right-0 top-0 h-3 w-3 -translate-y-1/2 translate-x-1/2 cursor-nesw-resize" },
  { id: "nw", className: "left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" },
  { id: "se", className: "bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" },
  { id: "sw", className: "bottom-0 left-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" },
];

const ROTATE_HANDLES = [
  { id: "ne", className: "right-0 top-0 translate-x-[150%] -translate-y-[150%]" },
  { id: "se", className: "bottom-0 right-0 translate-x-[150%] translate-y-[150%]" },
  { id: "sw", className: "bottom-0 left-0 -translate-x-[150%] translate-y-[150%]" },
  { id: "nw", className: "left-0 top-0 -translate-x-[150%] -translate-y-[150%]" },
];

function normalizeDegrees(value) {
  return Math.round(((value % 360) + 360) % 360);
}

export function PlacedLayer({
  layer,
  selected,
  suppressSelectionRing = false,
  selectedLayerCount = 0,
  selectedLayerIds = [],
  onSelect,
  onMove,
  onEdit,
  onEditComparison,
  onInteractionStart,
  onInteractionEnd,
  onGuideChange,
  layers = [],
  isExporting,
  timestampGutterWidth,
  timestampFontSize,
  timestampColor,
}) {
  const startRef = useRef(null);
  const layerRef = useRef(null);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const hasTimestamp = layer.kind === "text" && Boolean(layer.timestamp);
  const hasTimestampGutter =
    timestampGutterWidth > 0 &&
    layer.kind === "text" &&
    layer.sourceSegmentId;
  const timestampGutter = timestampGutterWidth;

  const style = {
    left: `${(layer.x / PAGE_W) * 100}%`,
    top: `${(layer.y / PAGE_H) * 100}%`,
    width: `${(layer.w / PAGE_W) * 100}%`,
    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
    transformOrigin: "center center",
    ...(layer.kind === "shape" || layer.kind === "emoji" || layer.kind === "image" || layer.locked
      ? { height: `${(layer.h / PAGE_W) * 100}cqw` }
      : { minHeight: `${(layer.h / PAGE_H) * 100}%` }),
  };

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    if (layer.locked) return;

    setIsPointerActive(true);
    onInteractionStart?.("drag");
    startRef.current = {
      mode: "drag",
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: layer.x,
      y: layer.y,
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function startResize(e, handle = "se") {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    if (layer.locked) return;

    setIsPointerActive(true);
    onInteractionStart?.("resize");
    startRef.current = {
      mode: "resize",
      handle,
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: layer.x,
      y: layer.y,
      w: layer.w,
      h: layer.h,
      aspectRatio: layer.w / layer.h,
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function startRotate(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    if (layer.locked || (selectedLayerCount <= 1 && layer.kind !== "shape" && layer.kind !== "emoji")) return;

    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsPointerActive(true);
    onInteractionStart?.("rotate");
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const pointerAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const selectedLayerIdSet = new Set(selectedLayerIds);
    const selectedLayers = layers.filter((candidate) =>
      selectedLayerIdSet.has(candidate.id) && !candidate.locked
    );

    startRef.current = {
      mode: "rotate",
      centerX,
      centerY,
      pointerAngle,
      rotation: layer.rotation || 0,
      groupBounds: selectedLayers.length > 1 ? getLayerBounds(selectedLayers) : null,
      groupLayers: selectedLayers.length > 1
        ? selectedLayers.map((selectedLayer) => ({ ...selectedLayer }))
        : null,
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function move(e) {
    const start = startRef.current;
    if (!start) return;

    const dx = ((e.clientX - start.pointerX) / 860) * PAGE_W;
    const dy = ((e.clientY - start.pointerY) / 1212) * PAGE_H;

    if (start.mode === "drag") {
      const patch = applySnapGuides({
        x: Math.round(start.x + dx),
        y: Math.round(start.y + dy),
        w: layer.w,
        h: layer.h,
      });

      onMove({
        x: patch.x,
        y: patch.y,
      });
    }

    if (start.mode === "resize") {
      onGuideChange?.([]);
      onMove(getResizePatch(start, dx, dy));
    }

    if (start.mode === "rotate") {
      onGuideChange?.([]);
      const pointerAngle = Math.atan2(e.clientY - start.centerY, e.clientX - start.centerX) * (180 / Math.PI);
      const rawRotation = start.rotation + pointerAngle - start.pointerAngle;
      const rotation = e.shiftKey
        ? Math.round(rawRotation / 15) * 15
        : rawRotation;

      onMove({
        rotation: normalizeDegrees(rotation),
        ...(start.groupBounds ? { groupBounds: start.groupBounds } : {}),
        ...(start.groupLayers ? { groupLayers: start.groupLayers } : {}),
      });
    }
  }

  function applySnapGuides(patch) {
    const threshold = 8;
    const guides = [];
    let next = { ...patch };

    const candidatesX = [
      { value: 0, guide: 0 },
      { value: PAGE_W / 2, guide: PAGE_W / 2 },
      { value: PAGE_W, guide: PAGE_W },
      ...layers
        .filter((candidate) => candidate.id !== layer.id && candidate.visible !== false)
        .flatMap((candidate) => [
          { value: candidate.x, guide: candidate.x },
          { value: candidate.x + candidate.w / 2, guide: candidate.x + candidate.w / 2 },
          { value: candidate.x + candidate.w, guide: candidate.x + candidate.w },
        ]),
    ];
    const candidatesY = [
      { value: 0, guide: 0 },
      { value: PAGE_H / 2, guide: PAGE_H / 2 },
      { value: PAGE_H, guide: PAGE_H },
      ...layers
        .filter((candidate) => candidate.id !== layer.id && candidate.visible !== false)
        .flatMap((candidate) => [
          { value: candidate.y, guide: candidate.y },
          { value: candidate.y + candidate.h / 2, guide: candidate.y + candidate.h / 2 },
          { value: candidate.y + candidate.h, guide: candidate.y + candidate.h },
        ]),
    ];

    const pointsX = [
      { key: "left", value: next.x, offset: 0 },
      { key: "center", value: next.x + next.w / 2, offset: next.w / 2 },
      { key: "right", value: next.x + next.w, offset: next.w },
    ];
    const pointsY = [
      { key: "top", value: next.y, offset: 0 },
      { key: "middle", value: next.y + next.h / 2, offset: next.h / 2 },
      { key: "bottom", value: next.y + next.h, offset: next.h },
    ];

    const snapX = findSnap(pointsX, candidatesX, threshold);
    const snapY = findSnap(pointsY, candidatesY, threshold);

    if (snapX) {
      next.x = Math.round(snapX.candidate.value - snapX.point.offset);
      guides.push({ axis: "x", value: snapX.candidate.guide });
    }

    if (snapY) {
      next.y = Math.round(snapY.candidate.value - snapY.point.offset);
      guides.push({ axis: "y", value: snapY.candidate.guide });
    }

    onGuideChange?.(guides);
    return next;
  }

  function findSnap(points, candidates, threshold) {
    let best = null;

    for (const point of points) {
      for (const candidate of candidates) {
        const distance = Math.abs(point.value - candidate.value);

        if (distance > threshold) continue;
        if (!best || distance < best.distance) {
          best = { point, candidate, distance };
        }
      }
    }

    return best;
  }

  function getResizePatch(start, dx, dy) {
    const isDiagonal = start.handle.length === 2;
    const shouldKeepAspect = layer.kind === "image" && isDiagonal && start.aspectRatio > 0;

    if (shouldKeepAspect) {
      return getAspectResizePatch(start, dx, dy);
    }

    const patch = {
      x: start.x,
      y: start.y,
      w: start.w,
      h: start.h,
    };

    if (start.handle.includes("e")) {
      patch.w = Math.max(MIN_LAYER_W, Math.round(start.w + dx));
    }

    if (start.handle.includes("s")) {
      patch.h = Math.max(MIN_LAYER_H, Math.round(start.h + dy));
    }

    if (start.handle.includes("w")) {
      const nextW = Math.max(MIN_LAYER_W, Math.round(start.w - dx));
      patch.w = nextW;
      patch.x = Math.round(start.x + start.w - nextW);
    }

    if (start.handle.includes("n")) {
      const nextH = Math.max(MIN_LAYER_H, Math.round(start.h - dy));
      patch.h = nextH;
      patch.y = Math.round(start.y + start.h - nextH);
    }

    return patch;
  }

  function getAspectResizePatch(start, dx, dy) {
    const patch = {
      x: start.x,
      y: start.y,
      w: start.w,
      h: start.h,
    };

    const widthDelta = start.handle.includes("e") ? dx : -dx;
    const heightDelta = start.handle.includes("s") ? dy : -dy;
    const delta =
      Math.abs(widthDelta) > Math.abs(heightDelta * start.aspectRatio)
        ? widthDelta
        : heightDelta * start.aspectRatio;

    patch.w = Math.max(MIN_LAYER_W, Math.round(start.w + delta));
    patch.h = Math.max(MIN_LAYER_H, Math.round(patch.w / start.aspectRatio));

    if (patch.h === MIN_LAYER_H) {
      patch.w = Math.max(MIN_LAYER_W, Math.round(patch.h * start.aspectRatio));
    }

    if (start.handle.includes("w")) {
      patch.x = Math.round(start.x + start.w - patch.w);
    }

    if (start.handle.includes("n")) {
      patch.y = Math.round(start.y + start.h - patch.h);
    }

    return patch;
  }

  function stop() {
    startRef.current = null;
    setIsPointerActive(false);
    onGuideChange?.([]);
    onInteractionEnd?.();
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  }

  return (
    <div
      ref={layerRef}
      onPointerDown={startDrag}
      onClick={onSelect}
      onDoubleClick={(e) => {
        if (layer.groupName === "Comparison" && layer.groupId) {
          e.preventDefault();
          e.stopPropagation();
          onSelect(e);
          onEditComparison?.(layer.groupId);
          return;
        }

        if (layer.kind !== "text") return;
        e.preventDefault();
        e.stopPropagation();
        onSelect(e);
        onEdit?.(layer.id);
      }}
      className={`group/layer absolute rounded-sm text-left ${layer.locked ? "cursor-default" : "cursor-move"} ${selected && !suppressSelectionRing
          ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-blue-950"
          : isExporting
            ? ""
            : "hover:ring-2 hover:ring-white/50"
        }`}
      style={style}
    >
      {layer.kind === "text" && (
        <div
          className="relative h-full"
          style={{
            display: layer.verticalAlign === "center" ? "flex" : undefined,
            alignItems: layer.verticalAlign === "center" ? "center" : undefined,
          }}
        >
          {hasTimestampGutter && hasTimestamp && (
            <div
              className="absolute left-0 top-0 pr-3 text-right font-black tabular-nums drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
              style={{
                fontSize: isExporting
                  ? `${timestampFontSize}px`
                  : `${timestampFontSize / 10}cqw`,
                color: timestampColor,
                lineHeight: 1.25,
                width: isExporting
                  ? `${timestampGutter}px`
                  : `${(timestampGutter / PAGE_W) * 100}cqw`,
              }}
            >
              {layer.timestamp}
            </div>
          )}

          <div
            className="vod-text whitespace-pre-wrap drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
            style={{
              width: "100%",
              color: layer.color || "#000000",
              paddingLeft: hasTimestampGutter
                ? isExporting
                  ? `${timestampGutter}px`
                  : `${(timestampGutter / PAGE_W) * 100}cqw`
                : isExporting
                  ? `${layer.padding || 0}px`
                  : layer.padding
                    ? `${(layer.padding / PAGE_W) * 100}cqw`
                    : 0,
              paddingRight: isExporting
                ? `${layer.padding || 0}px`
                : layer.padding
                  ? `${(layer.padding / PAGE_W) * 100}cqw`
                  : 0,
              paddingTop: isExporting
                ? `${layer.padding || 0}px`
                : layer.padding
                  ? `${(layer.padding / PAGE_W) * 100}cqw`
                  : 0,
              paddingBottom: isExporting
                ? `${layer.padding || 0}px`
                : layer.padding
                  ? `${(layer.padding / PAGE_W) * 100}cqw`
                  : 0,
              fontSize: isExporting
                ? `${layer.fontSize}px`
                : `${layer.fontSize / 10}cqw`,
              fontWeight: layer.weight,
              fontStyle: layer.italic ? "italic" : "normal",
              textDecoration: [
                layer.underline ? "underline" : "",
                layer.strikethrough ? "line-through" : "",
              ].filter(Boolean).join(" ") || "none",
              lineHeight: 1.25,
              textAlign: layer.align || "left",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {timestampGutterWidth <= 0 && hasTimestamp ? (
              `${layer.timestamp} - ${layer.text}`
            ) : layer.markdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {layer.text}
              </ReactMarkdown>
            ) : (
              layer.text
            )}
          </div>
        </div>
      )}

      {layer.kind === "image" && (
        <div className="flex h-full w-full items-center justify-center overflow-hidden bg-slate-950/40 shadow-lg">
          {layer.src ? (
            <img
              src={layer.src}
              alt={layer.name || "Screenshot"}
              className="h-full w-full"
              style={{ width: "100%", height: "100%", objectFit: layer.objectFit || "fill" }}
              draggable={false}
            />
          ) : (
              <div
                className="px-3 text-center text-xs font-bold uppercase text-slate-400 whitespace-pre-wrap"
                contentEditable
                suppressContentEditableWarning
                onDoubleClick={(e) => {
                  e.currentTarget.focus();
                }}
              >
                {"Missing image\nDouble click to edit"}
              </div>
          )}
        </div>
      )}

      {layer.kind === "shape" && (
        <svg
          className="overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%" }}
        >
          {renderShapeLayer(layer)}
        </svg>
      )}

      {layer.kind === "emoji" && (
        <img
          src={layer.src}
          alt={layer.name || "Rivals emoji"}
          className="h-full w-full object-fill"
          style={{ width: "100%", height: "100%", objectFit: "fill" }}
          draggable={false}
        />
      )}

      {selected && !isExporting && !layer.locked && selectedLayerCount <= 1 && (
        <>
          {!isPointerActive && (selectedLayerCount > 1 || layer.kind === "shape" || layer.kind === "emoji") && (
            <>
              {ROTATE_HANDLES.map((handle) => (
                <button
                  key={handle.id}
                  onPointerDown={startRotate}
                  className={`no-export absolute flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white opacity-0 ring-2 ring-white transition hover:bg-blue-400 hover:opacity-100 focus:opacity-100 group-hover/layer:opacity-100 ${handle.className}`}
                  title={`Rotate ${layer.kind}`}
                >
                  <RotateCw size={12} />
                </button>
              ))}
            </>
          )}

          {RESIZE_HANDLES.map((handle) => (
            <button
              key={handle.id}
              onPointerDown={(e) => startResize(e, handle.id)}
              className={`no-export absolute rounded-full bg-blue-500 ring-2 ring-white ${handle.className}`}
              title={`Resize ${handle.id}`}
            />
          ))}
        </>
      )}
    </div>
  );
}

function getLayerBounds(layers) {
  const left = Math.min(...layers.map((layer) => layer.x));
  const top = Math.min(...layers.map((layer) => layer.y));
  const right = Math.max(...layers.map((layer) => layer.x + layer.w));
  const bottom = Math.max(...layers.map((layer) => layer.y + layer.h));

  return {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
    centerX: left + (right - left) / 2,
    centerY: top + (bottom - top) / 2,
  };
}
