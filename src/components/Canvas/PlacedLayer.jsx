import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PAGE_W, PAGE_H } from "../../utils/constants.js";

export function PlacedLayer({ layer, selected, onSelect, onMove, isExporting }) {
  const startRef = useRef(null);

  const style = {
    left: `${(layer.x / PAGE_W) * 100}%`,
    top: `${(layer.y / PAGE_H) * 100}%`,
    width: `${(layer.w / PAGE_W) * 100}%`,
    minHeight: `${(layer.h / PAGE_H) * 100}%`,
  };

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

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

  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    startRef.current = {
      mode: "resize",
      pointerX: e.clientX,
      pointerY: e.clientY,
      w: layer.w,
      h: layer.h,
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
      onMove({
        x: Math.round(start.x + dx),
        y: Math.round(start.y + dy),
      });
    }

    if (start.mode === "resize") {
      onMove({
        w: Math.max(60, Math.round(start.w + dx)),
        h: Math.max(40, Math.round(start.h + dy)),
      });
    }
  }

  function stop() {
    startRef.current = null;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  }

  return (
    <div
      onPointerDown={startDrag}
      onClick={onSelect}
      className={`absolute cursor-move rounded-sm text-left ${selected
          ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-blue-950"
          : isExporting
            ? ""
            : "hover:ring-2 hover:ring-white/50"
        }`}
      style={style}
    >
      {layer.kind === "text" ? (
        <div
          className="vod-text whitespace-pre-wrap drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
          style={{
            color: layer.color || "#000000",
            fontSize: isExporting
              ? `${layer.fontSize}px`
              : `${layer.fontSize / 10}cqw`,
            fontWeight: layer.weight,
            fontStyle: layer.italic ? "italic" : "normal",
            lineHeight: 1.25,
            textAlign: layer.align || "left",
          }}
        >
          {layer.markdown ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {layer.text}
            </ReactMarkdown>
          ) : (
            layer.text
          )}
        </div>
      ) : (
        <div className="overflow-hidden bg-slate-800 shadow-lg">
          <img src={layer.src} alt="Screenshot" className="aspect-video w-full object-cover" />
            <div
              className="bg-[#25274f] px-3 py-2 text-center font-black uppercase leading-tight text-white"
              style={{
                fontSize: isExporting ? "12px" : "1.1cqw",
              }}
            >
            {layer.caption}
          </div>
        </div>
      )}

      {selected && !isExporting && (
        <button
          onPointerDown={startResize}
          className="no-export absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-blue-500 ring-2 ring-white"
          title="Resize"
        />
      )}
    </div>
  );
}
