import { useState } from "react";
import { Field } from "../FormFields/Field.jsx";
import { Label } from "../FormFields/Label.jsx";
import { RichTextArea } from "../FormFields/RichTextArea.jsx";

export function EditReviewDetailsModal({
  form,
  setForm,
  rawText,
  setRawText,
  heroes,
  onRegenerateFromText,
  onClose,
}) {
  const [localForm, setLocalForm] = useState({
    player: form.player || "",
    reviewer: form.reviewer || "",
    replayId: form.replayId || "",
    hero: form.hero || heroes[0] || "",
    requestId: form.requestId || "",
  });
  const [localRawText, setLocalRawText] = useState(rawText || "");

  function updateField(key, value) {
    setLocalForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function save() {
    setForm((prev) => ({
      ...prev,
      ...localForm,
    }));

    setRawText(localRawText);

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-700 bg-[#0f172a] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-blue-300">
              Review Details
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Edit Review Metadata
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Update the saved review details. Existing pages and layers will not be regenerated.
            </p>
          </div>

          <button
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Player"
              value={localForm.player}
              onChange={(v) => updateField("player", v)}
            />

            <Field
              label="Coach"
              value={localForm.reviewer}
              onChange={(v) => updateField("reviewer", v)}
            />
          </div>

          <Field
            label="Replay ID"
            value={localForm.replayId}
            onChange={(v) => updateField("replayId", v)}
          />

          <label className="block">
            <Label>Hero template</Label>

            <select
              className="input"
              value={localForm.hero}
              onChange={(e) => updateField("hero", e.target.value)}
            >
              {heroes.map((hero) => (
                <option key={hero}>
                  {hero}
                </option>
              ))}
            </select>
          </label>

          <RichTextArea
            label="Raw review text"
            value={localRawText}
            onChange={setLocalRawText}
            placeholder="Edit the pasted Discord review text here..."
            previewTitle="Formatted preview"
          />

          <div className="rounded-2xl border border-yellow-600/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            <p className="font-bold">Regenerate warning</p>
            <p className="mt-1">
              Regenerating will rebuild pages and auto-placed text from this raw review text.
              Manual layer edits on the current pages may be overwritten.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              onRegenerateFromText(localForm, localRawText);
              onClose();
            }}
          >
            Regenerate from Text
          </button>

          <button className="btn-primary" onClick={save}>
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
}
