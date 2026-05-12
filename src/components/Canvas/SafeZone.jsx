import { useRef } from "react";
import { PAGE_W, PAGE_H } from "../../utils/constants.js";

export function SafeZone({ zone, selected, onSelect, onChange }) {
  const startRef = useRef(null);

  const style = {
    left: `${(zone.x / PAGE_W) * 100}%`,
    top: `${(zone.y / PAGE_H) * 100}%`,
    width: `${(zone.w / PAGE_W) * 100}%`,
    height: `${(zone.h / PAGE_H) * 100}%`,
  };

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    startRef.current = {
      mode: "drag",
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: zone.x,
      y: zone.y,
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
      w: zone.w,
      h: zone.h,
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
      onChange({
        x: Math.round(start.x + dx),
        y: Math.round(start.y + dy),
      });
    }

    if (start.mode === "resize") {
      onChange({
        w: Math.max(40, Math.round(start.w + dx)),
        h: Math.max(30, Math.round(start.h + dy)),
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
      className={`no-export absolute cursor-move border bg-emerald-400/5 ${selected
          ? "border-emerald-300 ring-2 ring-emerald-300"
          : "border-emerald-400/40"
        }`}
      style={style}
    >
      <div className="absolute left-1 top-1 rounded bg-emerald-500/80 px-2 py-0.5 text-[10px] font-bold text-white">
        {zone.label}
      </div>

      {selected && (
        <button
          onPointerDown={startResize}
          className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-emerald-400 ring-2 ring-white"
          title="Resize safe zone"
        />
      )}
    </div>
  );
}
