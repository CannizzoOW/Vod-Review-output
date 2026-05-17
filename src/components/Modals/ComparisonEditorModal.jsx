import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Label } from "../FormFields/Label.jsx";

const PRESETS = [
  { id: "good-not-optimal", label: "Good / Not optimal", leftLabel: "Good", rightLabel: "Not optimal" },
  { id: "do-not", label: "Do this / Not this", leftLabel: "Do this", rightLabel: "Not this" },
  { id: "safe-risky", label: "Safe / Risky", leftLabel: "Safe", rightLabel: "Risky" },
  { id: "yours-better", label: "Your play / Better option", leftLabel: "Your play", rightLabel: "Better option" },
];

const DEFAULT_COMPARISON = {
    heading: "Positioning comparison",
    leftImage: "",
    rightImage: "",
    leftLabel: "Good",
    rightLabel: "Not optimal",
    leftCaption: "Use cover while keeping line of sight.",
    rightCaption: "Open space gives enemies easy angles.",
    takeaway: "Prefer positions that preserve healing access without exposing yourself.",
    showHeading: true,
    showLeftLabel: true,
    showRightLabel: true,
    showLeftCaption: true,
    showRightCaption: true,
    showTakeaway: true,
    layoutMode: "side-by-side",
    markerStyle: "color-bars",
};

export function ComparisonEditorModal({ initialValue, onClose, onSave }) {
  const [draft, setDraft] = useState(() => ({
    ...DEFAULT_COMPARISON,
    ...initialValue,
  }));
  const isEditing = Boolean(initialValue);

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

  function update(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function loadImage(file, key) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      update({ [key]: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  }

  function applyPreset(presetId) {
    const preset = PRESETS.find((option) => option.id === presetId);
    if (!preset) return;
    update({
      leftLabel: preset.leftLabel,
      rightLabel: preset.rightLabel,
    });
  }

  function switchSides() {
    setDraft((prev) => ({
      ...prev,
      leftImage: prev.rightImage,
      rightImage: prev.leftImage,
      leftLabel: prev.rightLabel,
      rightLabel: prev.leftLabel,
      leftCaption: prev.rightCaption,
      rightCaption: prev.leftCaption,
      showLeftLabel: prev.showRightLabel,
      showRightLabel: prev.showLeftLabel,
      showLeftCaption: prev.showRightCaption,
      showRightCaption: prev.showLeftCaption,
    }));
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-blue-300">Comparison Block</p>
            <h2 className="mt-1 text-2xl font-black">{isEditing ? "Edit visual coaching comparison" : "Create visual coaching comparison"}</h2>
          </div>

          <button type="button" className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={onClose}>
            x
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(360px,0.8fr)_minmax(420px,1.2fr)]">
          <div className="space-y-3">
            <label className="block">
              <Label>Preset</Label>
              <select className="input" defaultValue="good-not-optimal" onChange={(e) => applyPreset(e.target.value)}>
                {PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.label}</option>
                ))}
              </select>
            </label>

            <button type="button" className="btn-secondary w-full" onClick={switchSides}>
              <ArrowLeftRight size={16} />
              Switch sides
            </button>

            <label className="block">
              <Label>Layout</Label>
              <select className="input" value={draft.layoutMode} onChange={(e) => update({ layoutMode: e.target.value })}>
                <option value="side-by-side">Side by side</option>
                <option value="over-under">Over-under</option>
              </select>
            </label>

            <label className="block">
              <Label>Comparison markers</Label>
              <select className="input" value={draft.markerStyle} onChange={(e) => update({ markerStyle: e.target.value })}>
                <option value="color-bars">Green / red boxes</option>
                <option value="marks">Green V / red X</option>
              </select>
            </label>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <Label>Visible sections</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Toggle label="Heading" checked={draft.showHeading} onChange={(showHeading) => update({ showHeading })} />
                <Toggle label="Takeaway" checked={draft.showTakeaway} onChange={(showTakeaway) => update({ showTakeaway })} />
                <Toggle label="Left label" checked={draft.showLeftLabel} onChange={(showLeftLabel) => update({ showLeftLabel })} />
                <Toggle label="Right label" checked={draft.showRightLabel} onChange={(showRightLabel) => update({ showRightLabel })} />
                <Toggle label="Left caption" checked={draft.showLeftCaption} onChange={(showLeftCaption) => update({ showLeftCaption })} />
                <Toggle label="Right caption" checked={draft.showRightCaption} onChange={(showRightCaption) => update({ showRightCaption })} />
              </div>
            </div>

            <label className="block">
              <Label>Heading</Label>
              <input className="input" value={draft.heading} onChange={(e) => update({ heading: e.target.value })} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <ImageField label="Left image" onChange={(file) => loadImage(file, "leftImage")} />
              <ImageField label="Right image" onChange={(file) => loadImage(file, "rightImage")} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Left label" value={draft.leftLabel} onChange={(leftLabel) => update({ leftLabel })} />
              <TextField label="Right label" value={draft.rightLabel} onChange={(rightLabel) => update({ rightLabel })} />
            </div>

            <label className="block">
              <Label>Left caption</Label>
              <textarea className="input min-h-20 resize-y" value={draft.leftCaption} onChange={(e) => update({ leftCaption: e.target.value })} />
            </label>

            <label className="block">
              <Label>Right caption</Label>
              <textarea className="input min-h-20 resize-y" value={draft.rightCaption} onChange={(e) => update({ rightCaption: e.target.value })} />
            </label>

            <label className="block">
              <Label>Takeaway</Label>
              <textarea className="input min-h-20 resize-y" value={draft.takeaway} onChange={(e) => update({ takeaway: e.target.value })} />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <Label>Preview</Label>
            <div className="mt-2 rounded-2xl border border-slate-700 bg-slate-900 p-4">
              {draft.showHeading && draft.heading && <p className="text-lg font-black text-white">{draft.heading}</p>}
              <div className={`${draft.showHeading && draft.heading ? "mt-4" : ""} grid gap-4 ${draft.layoutMode === "side-by-side" ? "sm:grid-cols-2" : ""}`}>
                <PreviewSide image={draft.leftImage} label={draft.leftLabel} caption={draft.leftCaption} showLabel={draft.showLeftLabel} showCaption={draft.showLeftCaption} tone="good" markerStyle={draft.markerStyle} />
                <PreviewSide image={draft.rightImage} label={draft.rightLabel} caption={draft.rightCaption} showLabel={draft.showRightLabel} showCaption={draft.showRightCaption} tone="bad" markerStyle={draft.markerStyle} />
              </div>
              {draft.showTakeaway && draft.takeaway && <p className="mt-4 px-2 text-sm font-bold text-blue-200">{draft.takeaway}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 p-5">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={() => onSave(draft)}>
            {isEditing ? "Save comparison" : "Insert comparison"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function ImageField({ label, onChange }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input className="input file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:font-bold file:text-slate-100" type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function PreviewSide({ image, label, caption, showLabel, showCaption, tone, markerStyle }) {
  return (
    <div>
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-slate-800 text-sm font-bold text-slate-400">
        {markerStyle === "marks" && (
          <span className={`absolute left-2 top-1 text-4xl font-black leading-none ${tone === "good" ? "text-green-500" : "text-red-500"}`}>
            {tone === "good" ? "✓" : "✕"}
          </span>
        )}
        {image ? <img src={image} alt="" className="h-full w-full object-contain" /> : "Image slot"}
      </div>
      {showLabel && (
        <div className={`mt-2 rounded-lg px-3 py-2 text-center text-sm font-black text-white ${
          markerStyle === "marks"
            ? "bg-slate-500"
            : tone === "good"
              ? "bg-green-700"
              : "bg-red-700"
        }`}>
          {label}
        </div>
      )}
      {showCaption && caption && <p className="mt-2 px-2 text-sm text-slate-300">{caption}</p>}
    </div>
  );
}
