import { useEffect } from "react";

const SHORTCUTS = [
  { action: "Undo", keys: "Ctrl / Cmd + Z" },
  { action: "Redo", keys: "Ctrl / Cmd + Y" },
  { action: "Redo", keys: "Ctrl / Cmd + Shift + Z" },
  { action: "Duplicate selected", keys: "Ctrl / Cmd + D" },
  { action: "Delete selected", keys: "Delete / Backspace" },
  { action: "Deselect", keys: "Esc" },
  { action: "Zoom canvas", keys: "Alt + mouse wheel" },
  { action: "Open shortcuts", keys: "?" },
];

export function ShortcutsModal({ onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-blue-300">Shortcuts</p>
            <h2 className="mt-1 text-2xl font-black">Keyboard overview</h2>
          </div>

          <button
            type="button"
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            title="Close shortcuts"
          >
            x
          </button>
        </div>

        <div className="p-5">
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            {SHORTCUTS.map((shortcut) => (
              <div
                key={`${shortcut.action}-${shortcut.keys}`}
                className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-4 py-3 last:border-b-0"
              >
                <span className="text-sm font-bold text-slate-200">{shortcut.action}</span>
                <kbd className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-black text-slate-100">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
