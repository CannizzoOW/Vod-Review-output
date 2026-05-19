import { motion } from "framer-motion";
import { useState } from "react";
import { PAGE_W, PAGE_H, FALLBACK_TEMPLATE } from "../../utils/constants.js";
import { SafeZone } from "./SafeZone.jsx";
import { PlacedLayer } from "./PlacedLayer.jsx";

export function ReviewCanvas({
  canvasRef,
  exportRef,
  deselectAll,
  selectSafeZone,
  isExporting,
  templateBackground,
  layers,
  safeZones,
  selectedLayerIds,
  selectedSafeZoneId,
  selectLayer,
  editTextLayer,
  editComparison,
  updateLayer,
  resizeSelectedLayers,
  updateSafeZone,
  onLayerInteractionStart,
  onLayerInteractionEnd,
  canvasClick,
  canvasDrop,
  canvasDragOver,
  tool,
  gridEnabled,
  lockToRegions,
  timestampGutterWidth,
  timestampFontSize,
  timestampColor,
}) {
  const [snapGuides, setSnapGuides] = useState([]);
  const selectedVisibleLayers = layers.filter(
    (layer) => layer.visible !== false && selectedLayerIds.includes(layer.id)
  );
  const selectedBounds = selectedVisibleLayers.length > 1
    ? getLayerBounds(selectedVisibleLayers)
    : null;
  const cursor = tool === "insertText" || tool === "insertSegment" || tool === "insertImage" || tool === "insertComparison" || tool.startsWith("insertShape:")
    ? "cursor-crosshair"
    : "cursor-default";

  return (
    <motion.div
      className="origin-top"
      style={{
        width: isExporting ? `${PAGE_W}px` : "100%",
      }}
    >
      <div
        data-tutorial="review-canvas"
        ref={(node) => {
          canvasRef.current = node;
          exportRef.current = node;
        }}
        onClick={canvasClick}
        onDrop={canvasDrop}
        onDragOver={canvasDragOver}
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return;

          if (tool === "select" || tool === "safeZone") {
            deselectAll();
          }
        }}
        className={`editor-canvas relative aspect-[100/141.4286] w-full overflow-hidden bg-[#efeae7] ${isExporting ? "" : "rounded-2xl shadow-2xl ring-1 ring-white/10"
          } ${cursor}`}
        style={{ containerType: "size" }}
      >
        <img
          src={templateBackground}
          alt="Hero template"
          fetchPriority={isExporting ? "auto" : "high"}
          loading={isExporting ? "lazy" : "eager"}
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_TEMPLATE;
          }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        {gridEnabled && !isExporting && (
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        )}

        {lockToRegions &&
          safeZones.map((zone) => (
            <SafeZone
              key={zone.id}
              zone={zone}
              selected={selectedSafeZoneId === zone.id}
              onSelect={(e) => {
                e.stopPropagation();
                selectSafeZone(zone.id);
              }}
              onChange={(patch) => updateSafeZone(zone.id, patch, { snapToGrid: true })}
            />
          ))}

        {snapGuides.map((guide, index) => (
          <div
            key={`${guide.axis}-${guide.value}-${index}`}
            className="pointer-events-none absolute z-30 bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.9)]"
            style={
              guide.axis === "x"
                ? {
                  left: `${(guide.value / PAGE_W) * 100}%`,
                  top: 0,
                  width: "1px",
                  height: "100%",
                }
                : {
                  left: 0,
                  top: `${(guide.value / PAGE_H) * 100}%`,
                  width: "100%",
                  height: "1px",
                }
            }
          />
        ))}

        {selectedBounds && !isExporting && (
          <SelectedGroupBox
            bounds={selectedBounds}
            onResize={resizeSelectedLayers}
            onInteractionStart={onLayerInteractionStart}
            onInteractionEnd={onLayerInteractionEnd}
          />
        )}

        {layers.filter((layer) => layer.visible !== false).map((layer) => (
          <PlacedLayer
            key={layer.id}
            layer={layer}
            isExporting={isExporting}
            selected={!isExporting && selectedLayerIds.includes(layer.id)}
            suppressSelectionRing={layer.internalComparisonShape}
            selectedLayerCount={selectedLayerIds.length}
            selectedLayerIds={selectedLayerIds}
            onSelect={(e) => {
              e.stopPropagation();
              selectLayer(layer.id, e.shiftKey);
            }}
            onMove={(patch) => updateLayer(layer.id, patch, { snapToGrid: true })}
            onInteractionStart={onLayerInteractionStart}
            onInteractionEnd={onLayerInteractionEnd}
            onEdit={editTextLayer}
            onEditComparison={editComparison}
            onGuideChange={setSnapGuides}
            layers={layers}
            timestampGutterWidth={timestampGutterWidth}
            timestampFontSize={timestampFontSize}
            timestampColor={timestampColor}
          />
        ))}
      </div>
    </motion.div>
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
  };
}

const GROUP_RESIZE_HANDLES = [
  { id: "n", className: "left-1/2 top-0 h-2 w-5 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize" },
  { id: "s", className: "bottom-0 left-1/2 h-2 w-5 -translate-x-1/2 translate-y-1/2 cursor-ns-resize" },
  { id: "e", className: "right-0 top-1/2 h-5 w-2 -translate-y-1/2 translate-x-1/2 cursor-ew-resize" },
  { id: "w", className: "left-0 top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
  { id: "ne", className: "right-0 top-0 h-3 w-3 -translate-y-1/2 translate-x-1/2 cursor-nesw-resize" },
  { id: "nw", className: "left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" },
  { id: "se", className: "bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" },
  { id: "sw", className: "bottom-0 left-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" },
];

function SelectedGroupBox({ bounds, onResize, onInteractionStart, onInteractionEnd }) {
  function startResize(e, handle) {
    e.preventDefault();
    e.stopPropagation();
    onInteractionStart?.("resize");

    const start = {
      handle,
      pointerX: e.clientX,
      pointerY: e.clientY,
      bounds,
    };
    let lastBounds = bounds;

    function move(moveEvent) {
      const dx = ((moveEvent.clientX - start.pointerX) / 860) * PAGE_W;
      const dy = ((moveEvent.clientY - start.pointerY) / 1212) * PAGE_H;
      const nextBounds = getNextGroupBounds(start.bounds, start.handle, dx, dy);
      onResize(nextBounds, lastBounds);
      lastBounds = nextBounds;
    }

    function stop() {
      onInteractionEnd?.();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  return (
    <div
      className="pointer-events-none absolute z-30 border-2 border-blue-400"
      style={{
        left: `${(bounds.x / PAGE_W) * 100}%`,
        top: `${(bounds.y / PAGE_H) * 100}%`,
        width: `${(bounds.w / PAGE_W) * 100}%`,
        height: `${(bounds.h / PAGE_H) * 100}%`,
      }}
    >
      {GROUP_RESIZE_HANDLES.map((handle) => (
        <button
          key={handle.id}
          type="button"
          className={`pointer-events-auto absolute rounded-full bg-blue-500 ring-2 ring-white ${handle.className}`}
          onPointerDown={(e) => startResize(e, handle.id)}
          title={`Resize selection ${handle.id}`}
        />
      ))}
    </div>
  );
}

function getNextGroupBounds(bounds, handle, dx, dy) {
  const next = { ...bounds };

  if (handle.includes("e")) {
    next.w = Math.max(20, Math.round(bounds.w + dx));
  }

  if (handle.includes("s")) {
    next.h = Math.max(20, Math.round(bounds.h + dy));
  }

  if (handle.includes("w")) {
    const nextW = Math.max(20, Math.round(bounds.w - dx));
    next.x = Math.round(bounds.x + bounds.w - nextW);
    next.w = nextW;
  }

  if (handle.includes("n")) {
    const nextH = Math.max(20, Math.round(bounds.h - dy));
    next.y = Math.round(bounds.y + bounds.h - nextH);
    next.h = nextH;
  }

  return next;
}
