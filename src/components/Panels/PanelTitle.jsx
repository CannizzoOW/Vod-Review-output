import React from "react";

export function PanelTitle({ icon, title, subtitle }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon && React.cloneElement(icon, { className: "h-4 w-4 text-blue-300" })}
        <h2 className="font-black">{title}</h2>
      </div>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}
