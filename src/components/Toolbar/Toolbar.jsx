import { useState } from "react";
import {
  ChevronDown,
  Circle,
  ImagePlus,
  LayoutGrid,
  Minus,
  MousePointer2,
  MoveUpRight,
  Palette,
  RectangleHorizontal,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ToolButton } from "./ToolButton.jsx";
import { getWcagStatus } from "../../utils/wcagContrast.js";

export function Toolbar({
  tool,
  setTool,
  selectedLayer,
  selectedLayers,
  setLayer,
  zoom,
  setZoom,
  gridEnabled,
  setGridEnabled,
  lockToRegions,
  setLockToRegions,
  updateFooterLayer,
  loadPendingImage,
}) {
  const [contrastBackground, setContrastBackground] = useState("#ffffff");
  const shapeOptions = [
    { type: "rectangle", label: "Rectangle", shortLabel: "Rect", Icon: RectangleHorizontal },
    { type: "circle", label: "Circle", shortLabel: "Circle", Icon: Circle },
    { type: "line", label: "Line", shortLabel: "Line", Icon: Minus },
    { type: "arrow", label: "Arrow", shortLabel: "Arrow", Icon: MoveUpRight },
  ];
  const activeShape = tool.startsWith("insertShape:")
    ? tool.replace("insertShape:", "")
    : "rectangle";
  const activeShapeOption =
    shapeOptions.find((shape) => shape.type === activeShape) || shapeOptions[0];
  const ActiveShapeIcon = activeShapeOption.Icon;
  const colorableLayers = selectedLayers.filter((layer) =>
    ["text", "shape"].includes(layer.kind)
  );
  const hasColorableLayer = colorableLayers.length > 0;
  const hasShapeLayer = colorableLayers.some((layer) => layer.kind === "shape");
  const primaryColor = getPrimaryColor(selectedLayer);
  const strokeColor = selectedLayer?.kind === "shape"
    ? selectedLayer.strokeColor || "#2563eb"
    : colorableLayers.find((layer) => layer.kind === "shape")?.strokeColor || "#2563eb";
  const contrastChecks = getContrastChecks(
    selectedLayer,
    primaryColor,
    strokeColor,
    contrastBackground
  );

  function applyPrimaryColor(color) {
    colorableLayers.forEach((layer) => {
      if (layer.kind === "text") {
        setLayer(layer.id, { color });
        return;
      }

      if (layer.shapeType === "line" || layer.shapeType === "arrow") {
        setLayer(layer.id, { strokeColor: color, strokeOpacity: layer.strokeOpacity ?? 1 });
        return;
      }

      setLayer(layer.id, {
        fillColor: color,
        fillMode: "filled",
        fillOpacity: layer.fillOpacity || 1,
      });
    });
  }

  function applyStrokeColor(color) {
    colorableLayers
      .filter((layer) => layer.kind === "shape")
      .forEach((layer) =>
        setLayer(layer.id, {
          strokeColor: color,
          strokeOpacity: layer.strokeOpacity ?? 1,
        })
      );
  }

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0b1020] px-3">
      <div className="flex items-center gap-2">
        <ToolButton active={tool === "select"} onClick={() => setTool("select")} icon={<MousePointer2 />}>
          Select
        </ToolButton>

        <ToolButton active={tool === "insertText"} onClick={() => setTool("insertText")} icon={<Type />}>
          Insert text
        </ToolButton>

        <label className={`tool-btn ${tool === "insertImage" ? "tool-btn-active" : ""}`}>
          <ImagePlus size={16} /> Insert image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              loadPendingImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>

        <div className="group relative border-l border-slate-700 pl-2">
          <button
            className={`tool-btn ${tool.startsWith("insertShape:") ? "tool-btn-active" : ""}`}
            onClick={() => setTool(`insertShape:${activeShapeOption.type}`)}
          >
            <ActiveShapeIcon size={16} />
            Shapes
            <ChevronDown size={14} />
          </button>

          <div className="absolute left-2 top-full z-50 hidden min-w-40 flex-col gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1 shadow-2xl group-hover:flex group-focus-within:flex">
            {shapeOptions.map((shape) => {
              const ShapeIcon = shape.Icon;

              return (
                <button
                  key={shape.type}
                  className={`tool-btn h-9 justify-start rounded-lg px-2 ${tool === `insertShape:${shape.type}` ? "tool-btn-active" : ""}`}
                  onClick={() => setTool(`insertShape:${shape.type}`)}
                  title={`Insert ${shape.label.toLowerCase()}`}
                >
                  <ShapeIcon size={16} />
                  {shape.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <button className={`tool-btn ${gridEnabled ? "tool-btn-active" : ""}`} onClick={() => setGridEnabled(!gridEnabled)}>
          <LayoutGrid size={16} /> Grid
        </button>

        <button className={`tool-btn ${lockToRegions ? "tool-btn-active" : ""}`} onClick={() => setLockToRegions(!lockToRegions)}>
          Safe zones
        </button>

        <div className={`group relative ${hasColorableLayer ? "" : "opacity-45"}`}>
          <button
            className="tool-btn"
            disabled={!hasColorableLayer}
            title={hasColorableLayer ? "Change selected layer color" : "Select text or a shape to color"}
          >
            <Palette size={16} />
            Color
            <span
              className="h-4 w-4 rounded-full border border-white/60"
              style={{ backgroundColor: primaryColor }}
            />
            <ChevronDown size={14} />
          </button>

          {hasColorableLayer && (
            <div className="absolute left-0 top-full z-50 hidden min-w-44 flex-col gap-2 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl group-hover:flex group-focus-within:flex">
              <label className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm font-bold text-slate-200 hover:bg-slate-800">
                <span>{getPrimaryColorLabel(selectedLayer)}</span>
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border border-slate-700 bg-transparent p-0"
                  value={primaryColor}
                  onChange={(e) => applyPrimaryColor(e.target.value)}
                />
              </label>

              {hasShapeLayer && (
                <label className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm font-bold text-slate-200 hover:bg-slate-800">
                  <span>Stroke</span>
                  <input
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded border border-slate-700 bg-transparent p-0"
                    value={strokeColor}
                    onChange={(e) => applyStrokeColor(e.target.value)}
                  />
                </label>
              )}

              <div className="border-t border-slate-800 pt-2">
                <label className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm font-bold text-slate-200 hover:bg-slate-800">
                  <span>Check against</span>
                  <input
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded border border-slate-700 bg-transparent p-0"
                    value={contrastBackground}
                    onChange={(e) => setContrastBackground(e.target.value)}
                  />
                </label>

                <div className="mt-2 space-y-1 px-2 text-xs text-slate-300">
                  {contrastChecks.map((check) => (
                    <div key={check.label} className="flex items-center justify-between gap-3">
                      <span>{check.label}</span>
                      <span className={check.status.aa ? "text-emerald-300" : "text-red-300"}>
                        {check.status.ratio.toFixed(2)}:1 {check.status.aa ? "AA" : "Fail"}
                      </span>
                    </div>
                  ))}

                  {contrastChecks.some((check) => check.status.aaLarge && !check.status.aa) && (
                    <p className="text-[11px] text-amber-200">
                      Passes AA only for large/bold text.
                    </p>
                  )}

                  {contrastChecks.some((check) => check.status.aaa) && (
                    <p className="text-[11px] text-emerald-200">
                      AAA contrast met.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          className="tool-btn"
          onClick={updateFooterLayer}
          title="Update footer info"
        >
          Update footer
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-secondary h-9 px-3" onClick={() => setZoom((z) => Math.max(0.45, Number((z - 0.1).toFixed(2))))}>
          <ZoomOut size={16} />
        </button>

        <span className="w-16 text-center text-sm">{Math.round(zoom * 100)}%</span>

        <button className="btn-secondary h-9 px-3" onClick={() => setZoom((z) => Math.min(2, Number((z + 0.1).toFixed(2))))}>
          <ZoomIn size={16} />
        </button>
      </div>
    </div>
  );
}

function getPrimaryColor(layer) {
  if (layer?.kind === "text") return layer.color || "#000000";

  if (layer?.kind === "shape") {
    if (layer.shapeType === "line" || layer.shapeType === "arrow") {
      return layer.strokeColor || "#2563eb";
    }

    return layer.fillColor || "#2563eb";
  }

  return "#2563eb";
}

function getPrimaryColorLabel(layer) {
  if (layer?.kind === "text") return "Text";
  if (layer?.shapeType === "line" || layer?.shapeType === "arrow") return "Line";
  return "Fill";
}

function getContrastChecks(layer, primaryColor, strokeColor, contrastBackground) {
  if (layer?.kind === "shape") {
    if (layer.shapeType === "line" || layer.shapeType === "arrow") {
      return [
        {
          label: "Stroke / bg",
          status: getWcagStatus(strokeColor, contrastBackground),
        },
      ];
    }

    const checks = [
      {
        label: "Fill / bg",
        status: getWcagStatus(primaryColor, contrastBackground),
      },
    ];

    if ((layer.strokeOpacity ?? 1) > 0) {
      checks.push({
        label: "Stroke / fill",
        status: getWcagStatus(strokeColor, primaryColor),
      });
    }

    return checks;
  }

  return [
    {
      label: "Text / bg",
      status: getWcagStatus(primaryColor, contrastBackground),
    },
  ];
}
