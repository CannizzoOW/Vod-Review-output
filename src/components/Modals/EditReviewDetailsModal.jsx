import { useEffect, useState } from "react";
import { Field } from "../FormFields/Field.jsx";
import { Label } from "../FormFields/Label.jsx";
import { RichTextArea } from "../FormFields/RichTextArea.jsx";
import { DEFAULT_HERO, FALLBACK_TEMPLATE, getDefaultTemplateStyle, getHeroTemplatePath, getHeroTemplateStyles } from "../../utils/constants.js";

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
    hero: form.hero || DEFAULT_HERO || heroes[0] || "",
    templateStyle: form.templateStyle || getDefaultTemplateStyle(form.hero || DEFAULT_HERO || heroes[0] || ""),
    requestId: form.requestId || "",
  });
  const [localRawText, setLocalRawText] = useState(rawText || "");
  const templateStyles = getHeroTemplateStyles(localForm.hero);
  const selectedTemplateStyle = localForm.templateStyle || getDefaultTemplateStyle(localForm.hero);
  const selectedTemplateLabel =
    templateStyles.find((style) => style.value === selectedTemplateStyle)?.label ||
    selectedTemplateStyle ||
    "Default";
  const selectedTemplatePath = getHeroTemplatePath(localForm.hero, selectedTemplateStyle);
  const selectedTemplatePreview = selectedTemplatePath
    ? `${import.meta.env.BASE_URL}${selectedTemplatePath.replace(/^\/+/, "")}`
    : FALLBACK_TEMPLATE;

  function updateField(key, value) {
    setLocalForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateHero(hero) {
    setLocalForm((prev) => ({
      ...prev,
      hero,
      templateStyle: getDefaultTemplateStyle(hero),
    }));
  }

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

  function save() {
    setForm((prev) => ({
      ...prev,
      ...localForm,
    }));

    setRawText(localRawText);

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-700 bg-[#0f172a] p-5 shadow-2xl">
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

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  onChange={(e) => updateHero(e.target.value)}
                >
                  {heroes.map((hero) => (
                    <option key={hero}>
                      {hero}
                    </option>
                  ))}
                </select>
              </label>

              {templateStyles.length > 1 && (
                <label className="block">
                  <Label>Template style</Label>

                  <select
                    className="input"
                    value={selectedTemplateStyle}
                    onChange={(e) => updateField("templateStyle", e.target.value)}
                  >
                    {templateStyles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
              <div className="mb-2">
                <p className="text-sm font-black text-slate-100">{localForm.hero}</p>
                <p className="text-xs text-slate-400">{selectedTemplateLabel}</p>
              </div>

              <div className="aspect-[1080/1527] overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <img
                  key={`${localForm.hero}-${selectedTemplateStyle}`}
                  src={selectedTemplatePreview}
                  alt={`${localForm.hero} ${selectedTemplateLabel} template preview`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_TEMPLATE;
                  }}
                />
              </div>
            </div>
          </div>

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
              Existing text segments will be replaced, while manually added layers such as images are kept.
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
