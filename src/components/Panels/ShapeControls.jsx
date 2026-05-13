import { Label } from "../FormFields/Label.jsx";
import { NumberField } from "../FormFields/NumberField.jsx";

const SHAPE_TYPES = [
  { value: "rectangle", label: "Rectangle" },
  { value: "circle", label: "Circle" },
  { value: "line", label: "Line" },
  { value: "arrow", label: "Arrow" },
];

function opacityPercent(value, fallback = 1) {
  return Math.round((value ?? fallback) * 100);
}

function opacityDecimal(value) {
  return Math.max(0, Math.min(1, Number(value) / 100));
}

export function ShapeControls({ layer, onChange }) {
  const isLinear = layer.shapeType === "line" || layer.shapeType === "arrow";
  const fillOpacity = opacityPercent(layer.fillOpacity, layer.fillMode === "filled" ? 1 : 0);
  const strokeOpacity = opacityPercent(layer.strokeOpacity, 1);

  return (
    <div className="mt-3 space-y-3">
      <label className="block">
        <Label>Shape</Label>
        <select
          className="input"
          value={layer.shapeType || "rectangle"}
          onChange={(e) => onChange({ shapeType: e.target.value })}
        >
          {SHAPE_TYPES.map((shape) => (
            <option key={shape.value} value={shape.value}>
              {shape.label}
            </option>
          ))}
        </select>
      </label>

      {!isLinear && (
        <div>
          <Label>Fill</Label>
          <div className="flex gap-2">
            <button
              className={`tool-btn flex-1 ${layer.fillMode !== "filled" ? "tool-btn-active" : ""}`}
              onClick={() => onChange({ fillMode: "hollow", fillOpacity: 0 })}
            >
              Hollow
            </button>
            <button
              className={`tool-btn flex-1 ${layer.fillMode === "filled" ? "tool-btn-active" : ""}`}
              onClick={() => onChange({ fillMode: "filled", fillOpacity: layer.fillOpacity || 1 })}
            >
              Filled
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {!isLinear && (
          <>
            <label className="block">
              <Label>Fill color</Label>
              <input
                className="input h-10 p-1"
                type="color"
                value={layer.fillColor || "#2563eb"}
                onChange={(e) => onChange({ fillColor: e.target.value })}
              />
            </label>

            <label className="block">
              <Label>Fill opacity</Label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                value={fillOpacity}
                onChange={(e) => {
                  const nextOpacity = opacityDecimal(e.target.value);
                  onChange({
                    fillMode: nextOpacity > 0 ? "filled" : "hollow",
                    fillOpacity: nextOpacity,
                  });
                }}
              />
            </label>
          </>
        )}

        <label className="block">
          <Label>Stroke color</Label>
          <input
            className="input h-10 p-1"
            type="color"
            value={layer.strokeColor || "#2563eb"}
            onChange={(e) => onChange({ strokeColor: e.target.value })}
          />
        </label>

        <label className="block">
          <Label>Stroke opacity</Label>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            value={strokeOpacity}
            onChange={(e) => onChange({ strokeOpacity: opacityDecimal(e.target.value) })}
          />
        </label>
      </div>

      <NumberField
        label="Stroke width"
        value={layer.strokeWidth || 6}
        onChange={(v) => onChange({ strokeWidth: Math.max(1, v) })}
      />

      <NumberField
        label="Rotation"
        value={layer.rotation || 0}
        onChange={(v) => onChange({ rotation: ((v % 360) + 360) % 360 })}
      />

      <div className="grid grid-cols-2 gap-2">
        {!isLinear && (
          <button
            className={`tool-btn ${fillOpacity === 0 ? "tool-btn-active" : ""}`}
            onClick={() => onChange({ fillMode: "hollow", fillOpacity: 0 })}
          >
            No fill
          </button>
        )}

        <button
          className={`tool-btn ${strokeOpacity === 0 ? "tool-btn-active" : ""}`}
          onClick={() => onChange({ strokeOpacity: strokeOpacity === 0 ? 1 : 0 })}
        >
          No stroke
        </button>
      </div>
    </div>
  );
}
