import {
  ImagePlus,
  LayoutGrid,
  MousePointer2,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ToolButton } from "./ToolButton.jsx";

export function Toolbar({
  tool,
  setTool,
  zoom,
  setZoom,
  gridEnabled,
  setGridEnabled,
  lockToRegions,
  setLockToRegions,
  loadPendingImage,
}) {
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
          <input type="file" accept="image/*" className="hidden" onChange={(e) => loadPendingImage(e.target.files?.[0])} />
        </label>

        <button className={`tool-btn ${gridEnabled ? "tool-btn-active" : ""}`} onClick={() => setGridEnabled(!gridEnabled)}>
          <LayoutGrid size={16} /> Grid
        </button>

        <button className={`tool-btn ${lockToRegions ? "tool-btn-active" : ""}`} onClick={() => setLockToRegions(!lockToRegions)}>
          Safe zones
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
