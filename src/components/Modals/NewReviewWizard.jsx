import { useMemo, useEffect } from "react";
import { parseDiscordReview } from "../../utils/parsing.js";
import { Field } from "../FormFields/Field.jsx";
import { Label } from "../FormFields/Label.jsx";
import { RichTextArea } from "../FormFields/RichTextArea.jsx";
import { getDefaultTemplateStyle, getHeroTemplateStyles } from "../../utils/constants.js";

export function NewReviewWizard({
  step,
  setStep,
  wizardSource,
  setWizardSource,
  wizardRawText,
  setWizardRawText,
  wizardForm,
  setWizardForm,
  heroes,
  onClose,
  onFinish,
}) {
  const options = [
    {
      id: "json",
      title: "Import JSON",
      description: "Use a review file exported by the Discord bot.",
      disabled: true,
      message: "JSON import will be re-enabled when the bot is operational.",
    },
    {
      id: "paste",
      title: "Paste Discord review",
      description: "Paste raw review text and let the editor parse it into segments.",
    },
    {
      id: "blank",
      title: "Start blank",
      description: "Create an empty review and fill everything manually.",
    },
  ];

  const parsedPreview = useMemo(() => {
    if (wizardSource !== "paste") {
      return {
        replayId: "",
        segments: [],
      };
    }

    return parseDiscordReview(wizardRawText || "");
  }, [wizardSource, wizardRawText]);
  const templateStyles = getHeroTemplateStyles(wizardForm.hero);

  useEffect(() => {
    if (wizardSource !== "paste") return;
    if (!parsedPreview.replayId) return;

    setWizardForm((prev) => {
      if (prev.replayId) return prev;

      return {
        ...prev,
        replayId: parsedPreview.replayId,
      };
    });
  }, [wizardSource, parsedPreview.replayId, setWizardForm]);

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

  function updateWizardForm(key, value) {
    setWizardForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateHero(hero) {
    setWizardForm((prev) => ({
      ...prev,
      hero,
      templateStyle: getDefaultTemplateStyle(hero),
    }));
  }

  function goNext() {
    if (wizardSource === "json") return;

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2 && (wizardSource === "paste" || wizardSource === "blank")) {
      setStep(3);
      return;
    }

    if (step === 3 && wizardSource === "paste" && parsedPreview.replayId) {
      setWizardForm((prev) => ({
        ...prev,
        replayId: prev.replayId || parsedPreview.replayId,
      }));
    }

    onFinish();
  }

  function getPrimaryButtonText() {
    if (step === 1) return "Continue";

    if (step === 2 && wizardSource === "paste") {
      return "Continue";
    }

    if (step === 2 && wizardSource === "blank") {
      return "Continue";
    }

    return "Create Review";
  }

  function getStepCount() {
    return wizardSource === "paste" || wizardSource === "blank" ? 3 : 2;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-700 bg-[#0f172a] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-blue-300">
              New Review Wizard
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {step === 1 && "Choose source"}
              {step === 2 && "Review details"}
              {step === 3 && wizardSource === "paste" && "Paste review text"}
              {step === 3 && wizardSource === "blank" && "Starter text"}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {step === 1 && "Start by choosing where the review data should come from."}
              {step === 2 && "Fill in the basic review information before creating the workspace."}
              {step === 3 && wizardSource === "paste" && "Paste the Discord review text. The editor will parse and auto-place it."}
              {step === 3 && wizardSource === "blank" && "Optionally add starter text. You can edit it later with the full text editor."}
            </p>
          </div>

          <button
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            title="Close wizard"
          >
            ×
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-3" data-tutorial="wizard-source">
            {options.map((option) => (
              <button
                key={option.id}
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  setWizardSource(option.id);
                }}
                className={`w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${wizardSource === option.id
                    ? "border-blue-400 bg-blue-600/20"
                    : option.disabled
                      ? "border-slate-800 bg-slate-950"
                      : "border-slate-700 bg-slate-950 hover:border-slate-500"
                  }`}
              >
                <p className="font-black">{option.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {option.description}
                </p>
                {option.message && (
                  <p className="mt-2 rounded-lg border border-yellow-600/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-100">
                    {option.message}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3" data-tutorial="wizard-template">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Player"
                value={wizardForm.player}
                onChange={(v) => updateWizardForm("player", v)}
              />

              <Field
                label="Coach"
                value={wizardForm.reviewer}
                onChange={(v) => updateWizardForm("reviewer", v)}
              />
            </div>

            <Field
              label="Replay ID"
              value={wizardForm.replayId}
              onChange={(v) => updateWizardForm("replayId", v)}
            />

            <label className="block">
              <Label>Hero template</Label>
              <select
                className="input"
                value={wizardForm.hero}
                onChange={(e) => updateHero(e.target.value)}
              >
                {heroes.map((hero) => (
                  <option key={hero}>{hero}</option>
                ))}
              </select>
            </label>

            {templateStyles.length > 1 && (
              <label className="block">
                <Label>Template style</Label>
                <select
                  className="input"
                  value={wizardForm.templateStyle || getDefaultTemplateStyle(wizardForm.hero)}
                  onChange={(e) => updateWizardForm("templateStyle", e.target.value)}
                >
                  {templateStyles.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
              <p className="font-bold text-slate-200">Selected source</p>
              <p className="mt-1">
                {wizardSource === "json" && "JSON import will be re-enabled when the bot is operational."}
                {wizardSource === "paste" && "Paste raw Discord review text after setup."}
                {wizardSource === "blank" && "Start with a clean review and optional starter text."}
              </p>
            </div>
          </div>
        )}

        {step === 3 && wizardSource === "paste" && (
          <div className="space-y-3" data-tutorial="wizard-text">
            <RichTextArea
              label="Discord review text"
              value={wizardRawText}
              onChange={setWizardRawText}
              placeholder="Paste the full Discord review here..."
              previewTitle="Formatted preview"
            />

            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-200">Detected segments</p>
                  <p className="mt-1 text-slate-400">
                    {parsedPreview.segments.length} blocks detected
                    {parsedPreview.replayId ? ` • Replay ID: ${parsedPreview.replayId}` : ""}
                  </p>
                </div>
              </div>

              {parsedPreview.segments.length > 0 ? (
                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {parsedPreview.segments.slice(0, 12).map((segment) => (
                    <div
                      key={segment.id}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-3"
                    >
                      <div className="mb-1 flex justify-between gap-2">
                        <span className="text-xs font-black uppercase text-blue-200">
                          {segment.type}
                        </span>

                        {segment.timestamp && (
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                            {segment.timestamp}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-200">
                        {segment.title}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {segment.text}
                      </p>
                    </div>
                  ))}

                  {parsedPreview.segments.length > 12 && (
                    <p className="text-xs text-slate-500">
                      + {parsedPreview.segments.length - 12} more segments
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-yellow-600/40 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                  No segments detected yet. Paste a review with headings, bullets, or timestamps.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && wizardSource === "blank" && (
          <div className="space-y-3" data-tutorial="wizard-text">
            <RichTextArea
              label="Starter text"
              value={wizardRawText}
              onChange={setWizardRawText}
              placeholder="Optional notes for the first page..."
              previewTitle="Formatted preview"
            />

            <p className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
              Leave this empty to create a clean sheet with just the title area.
              Starter text can be edited later by double-clicking the text layer.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Step {step} of {getStepCount()}
          </p>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>

            {step > 1 && (
              <button className="btn-secondary" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}

            <button
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={wizardSource === "json" || (step === 3 && wizardSource === "paste" && !wizardRawText.trim())}
              onClick={goNext}
            >
              {getPrimaryButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
