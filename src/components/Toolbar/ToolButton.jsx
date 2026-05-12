import React from "react";

export function ToolButton({ active, icon, children, onClick }) {
  return (
    <button onClick={onClick} className={`tool-btn ${active ? "tool-btn-active" : ""}`}>
      {React.cloneElement(icon, { size: 16 })}
      {children}
    </button>
  );
}
