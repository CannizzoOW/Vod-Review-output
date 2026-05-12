import { motion } from "framer-motion";
import { PAGE_W, PAGE_H, FALLBACK_TEMPLATE } from "../../utils/constants.js";
import { SafeZone } from "./SafeZone.jsx";
import { PlacedLayer } from "./PlacedLayer.jsx";

export function ReviewCanvas({
  refEl,
  exportRef,
  deselectAll,
  selectSafeZone,
  isExporting,
  templateBackground,
  layers,
  safeZones,
  selectedLayerId,
  selectedLayerIds,
  selectedSafeZoneId,
  selectLayer,
  updateLayer,
  updateSafeZone,
  canvasClick,
  tool,
  zoom,
  gridEnabled,
  lockToRegions,
}) {
  const cursor = tool === "insertText" || tool === "insertImage" ? "cursor-crosshair" : "cursor-default";

  return (
    <motion.div
      className="origin-top"
      style={{
        width: isExporting ? `${PAGE_W}px` : "100%",
      }}
    >
      <div
        ref={(node) => {
          refEl.current = node;
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

        {layers.map((layer) => (
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
          />
        ))}
      </div>
    </motion.div>
  );
}
