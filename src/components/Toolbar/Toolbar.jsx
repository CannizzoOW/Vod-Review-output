import { useState } from "react";
import {
  ChevronDown,
  Circle,
  Columns2,
  Contrast,
  ImagePlus,
  LayoutGrid,
  Minus,
  MousePointer2,
  MoveUpRight,
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
  layers,
  canvasBackgroundColor,
  setLayer,
  zoom,
  setZoom,
  gridEnabled,
  setGridEnabled,
  lockToRegions,
  setLockToRegions,
  loadPendingImage,
}) {
  const [manualContrastBackground, setManualContrastBackground] = useState("");
  const detectedContrastBackground = selectedLayer
    ? getDetectedBackgroundColor(selectedLayer, layers, canvasBackgroundColor)
    : canvasBackgroundColor;
  const contrastBackground = manualContrastBackground || detectedContrastBackground;
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
    ["text", "shape"].includes(layer.kind) && !layer.internalComparisonShape
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
  const canvasContrastChecks = getCanvasContrastChecks(layers, canvasBackgroundColor);
  const passingCanvasChecks = canvasContrastChecks.filter((check) => check.status.aa).length;

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

        <span data-tutorial="comparison-tool">
          <ToolButton active={tool === "insertComparison"} onClick={() => setTool("insertComparison")} icon={<Columns2 />}>
            Comparison
          </ToolButton>
        </span>

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

        <div className="group relative">
          <button
            className="tool-btn"
            title="Check canvas WCAG contrast"
            data-tutorial="wcag-tool"
          >
            <Contrast size={16} />
            Accessibility check
            <ChevronDown size={14} />
          </button>

          <div className="absolute left-0 top-full z-50 hidden min-w-64 flex-col gap-2 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl group-hover:flex group-focus-within:flex">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-100">
                <span>Canvas check</span>
                <span className={passingCanvasChecks === canvasContrastChecks.length ? "text-emerald-300" : "text-amber-200"}>
                  {canvasContrastChecks.length > 0
                    ? `${passingCanvasChecks}/${canvasContrastChecks.length} pass`
                    : "Pass"}
                </span>
              </div>

              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto text-xs text-slate-300">
                {canvasContrastChecks.length ? (
                  canvasContrastChecks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between gap-3">
                      <span className="max-w-36 truncate">{check.label}</span>
                      <span className={check.status.aa ? "text-emerald-300" : "text-red-300"}>
                        {check.status.ratio.toFixed(2)}:1 {check.status.aa ? "AA" : "Fail"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No visible text layers to check.</p>
                )}
              </div>
            </div>

            {hasColorableLayer && (
              <>
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
                  onChange={(e) => setManualContrastBackground(e.target.value)}
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
              </>
            )}
          </div>
        </div>

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

function getDetectedBackgroundColor(layer, layers = [], fallback = "#efeae7") {
  const selectedIndex = layers.findIndex((candidate) => candidate.id === layer.id);
  const candidates = selectedIndex >= 0 ? layers.slice(0, selectedIndex).reverse() : [...layers].reverse();

  for (const candidate of candidates) {
    if (candidate.visible === false) continue;
    if (!rectanglesIntersect(layer, candidate)) continue;

    if (
      candidate.kind === "shape" &&
      candidate.fillMode !== "hollow" &&
      (candidate.fillOpacity ?? 1) > 0
    ) {
      return candidate.fillColor || fallback;
    }
  }

  return fallback;
}

function getCanvasContrastChecks(layers = [], fallback = "#efeae7") {
  return layers
    .filter(
      (layer) =>
        layer.visible !== false &&
        layer.kind === "text" &&
        !isSystemTextLayer(layer)
    )
    .map((layer) => {
      const background = getDetectedBackgroundColor(layer, layers, fallback);

      return {
        id: layer.id,
        label: layer.name || layer.text || "Text",
        status: getWcagStatus(layer.color || "#000000", background),
      };
    });
}

function isSystemTextLayer(layer) {
  return layer.id === "page-title" || layer.id === "footer-info";
}

function rectanglesIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
