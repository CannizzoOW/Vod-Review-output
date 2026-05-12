import { Trash2, Type } from "lucide-react";
import { PanelTitle } from "./PanelTitle.jsx";
import { Label } from "../FormFields/Label.jsx";
import { Field } from "../FormFields/Field.jsx";
import { NumberField } from "../FormFields/NumberField.jsx";
import { TextArea } from "../FormFields/TextArea.jsx";
import { DEFAULT_SAFE_ZONES } from "../../utils/constants.js";
import { getLayerListLabel } from "../../utils/textUtils.js";

export function RightPanel({
  selectedLayer,
  setLayer,
  removeLayer,
  selectedSafeZone,
  setSafeZone,
  activePage,
  selectedLayerIds,
  selectLayer,
  setTool,
  safeZones,
  selectedSafeZoneId,
  setSelectedSafeZoneId,
  setSelectedLayerId,
  setSelectedLayerIds,
  layerListOpen,
  setLayerListOpen,
  safeZonesOpen,
  setSafeZonesOpen,
}) {
  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden p-3">
      <PanelTitle title="Properties" subtitle="Move, resize and edit layers/safe zones." />

      {selectedLayer ? (
        <div className="panel mt-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-black">Selected {selectedLayer.kind}</p>
            <button
              onClick={() => removeLayer(selectedLayer.id)}
              className="rounded-lg p-2 text-red-300 hover:bg-red-500/10"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumberField label="X" value={selectedLayer.x} onChange={(v) => setLayer(selectedLayer.id, { x: v })} />
            <NumberField label="Y" value={selectedLayer.y} onChange={(v) => setLayer(selectedLayer.id, { y: v })} />
            <NumberField label="Width" value={selectedLayer.w} onChange={(v) => setLayer(selectedLayer.id, { w: v })} />
            <NumberField label="Height" value={selectedLayer.h} onChange={(v) => setLayer(selectedLayer.id, { h: v })} />
          </div>

          {selectedLayer.kind === "text" && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <NumberField label="Font size" value={selectedLayer.fontSize} onChange={(v) => setLayer(selectedLayer.id, { fontSize: v })} />
                <NumberField label="Weight" value={selectedLayer.weight} onChange={(v) => setLayer(selectedLayer.id, { weight: v })} />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  className={`tool-btn ${selectedLayer.weight >= 700 ? "tool-btn-active" : ""}`}
                  onClick={() =>
                    setLayer(selectedLayer.id, {
                      weight: selectedLayer.weight >= 700 ? 500 : 900,
                    })
                  }
                >
                  Bold
                </button>

                <button
                  className={`tool-btn ${selectedLayer.italic ? "tool-btn-active" : ""}`}
                  onClick={() => setLayer(selectedLayer.id, { italic: !selectedLayer.italic })}
                >
                  Italic
                </button>

                <button
                  className={`tool-btn ${selectedLayer.autoFlow ? "tool-btn-active" : ""}`}
                  onClick={() =>
                    setLayer(selectedLayer.id, {
                      autoFlow: !selectedLayer.autoFlow,
                    })
                  }
                >
                  Flow
                </button>
              </div>

              <TextArea label="Markdown Text" value={selectedLayer.text} onChange={(v) => setLayer(selectedLayer.id, { text: v })} />
            </>
          )}

          {selectedLayer.kind === "image" && (
            <Field label="Caption" value={selectedLayer.caption} onChange={(v) => setLayer(selectedLayer.id, { caption: v })} />
          )}
        </div>
      ) : selectedSafeZone ? (
        <div className="panel mt-3">
          <p className="mb-3 font-black">Safe zone: {selectedSafeZone.label}</p>

          <Field label="Label" value={selectedSafeZone.label} onChange={(v) => setSafeZone(selectedSafeZone.id, { label: v })} />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <NumberField label="X" value={selectedSafeZone.x} onChange={(v) => setSafeZone(selectedSafeZone.id, { x: v })} />
            <NumberField label="Y" value={selectedSafeZone.y} onChange={(v) => setSafeZone(selectedSafeZone.id, { y: v })} />
            <NumberField label="Width" value={selectedSafeZone.w} onChange={(v) => setSafeZone(selectedSafeZone.id, { w: v })} />
            <NumberField label="Height" value={selectedSafeZone.h} onChange={(v) => setSafeZone(selectedSafeZone.id, { h: v })} />
          </div>

          <button className="btn-secondary mt-3 w-full" onClick={() => safeZones.splice(0, safeZones.length, ...DEFAULT_SAFE_ZONES)}>
            Reset safe zones
          </button>
        </div>
      ) : (
        <div className="panel mt-3 text-sm text-slate-400">
          Select a layer or safe zone to edit it.
        </div>
      )}

      <div className="panel mt-3">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setLayerListOpen((v) => !v)}
          title={layerListOpen ? "Collapse layer list" : "Expand layer list"}
        >
          <div>
            <p className="font-black">Layer list</p>
            <p className="text-sm text-slate-400">
              {activePage.layers.length} layers
            </p>
          </div>

          <span className="text-lg text-slate-400">
            {layerListOpen ? "▾" : "▸"}
          </span>
        </button>

        {layerListOpen && (
          <div className="mt-3 space-y-2">
            {activePage.layers.map((layer, index) => (
              <button
                key={layer.id}
                onClick={(e) => {
                  selectLayer(layer.id, e.shiftKey);
                  setTool("select");
                }}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm ${selectedLayerIds.includes(layer.id)
                    ? "bg-blue-600"
                    : "bg-slate-950 hover:bg-slate-800"
                  }`}
              >
                <span className="mr-2 text-slate-400">{index + 1}.</span>

                {layer.kind === "text" && (
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-slate-200">
                    <Type size={13} />
                  </span>
                )}

                {layer.kind === "image" && (
                  <span className="mr-2 inline-flex h-5 items-center justify-center rounded bg-slate-700 px-1.5 text-[10px] font-black">
                    IMG
                  </span>
                )}

                <span className="truncate">
                  {getLayerListLabel(layer).replace(/^T\s|^IMG\s/, "")}
                </span>

                {layer.autoFlow && (
                  <span className="ml-2 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px]">
                    flow
                  </span>
                )}

                {layer.id === "footer-info" && (
                  <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px]">
                    footer
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel mt-3">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setSafeZonesOpen((v) => !v)}
          title={safeZonesOpen ? "Collapse safe zones" : "Expand safe zones"}
        >
          <div>
            <p className="font-black">Safe zones</p>
            <p className="text-sm text-slate-400">{safeZones.length} zones</p>
          </div>

          <span className="text-lg text-slate-400">
            {safeZonesOpen ? "▾" : "▸"}
          </span>
        </button>

        {safeZonesOpen && (
          <div className="mt-3 space-y-2">
            {safeZones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => {
                  setSelectedLayerId(null);
                  setSelectedLayerIds([]);
                  setSelectedSafeZoneId(zone.id);
                  setTool("safeZone");
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selectedSafeZoneId === zone.id
                    ? "bg-emerald-600"
                    : "bg-slate-950 hover:bg-slate-800"
                  }`}
              >
                {zone.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
