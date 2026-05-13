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
  updateLayer,
  updateSafeZone,
  canvasClick,
  tool,
  gridEnabled,
  lockToRegions,
  timestampGutterWidth,
  timestampFontSize,
  timestampColor,
}) {
  const [snapGuides, setSnapGuides] = useState([]);
  const cursor = tool === "insertText" || tool === "insertImage" || tool.startsWith("insertShape:")
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
        ref={(node) => {
          canvasRef.current = node;
          exportRef.current = node;
        }}
        onClick={canvasClick}
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

        {layers.filter((layer) => layer.visible !== false).map((layer) => (
          <PlacedLayer
            key={layer.id}
            layer={layer}
            isExporting={isExporting}
            selected={!isExporting && selectedLayerIds.includes(layer.id)}
            onSelect={(e) => {
              e.stopPropagation();
              selectLayer(layer.id, e.shiftKey);
            }}
            onMove={(patch) => updateLayer(layer.id, patch, { snapToGrid: true })}
            onEdit={editTextLayer}
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
