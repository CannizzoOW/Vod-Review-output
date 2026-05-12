import { RefreshCcw } from "lucide-react";
import { Field } from "../FormFields/Field.jsx";
import { Label } from "../FormFields/Label.jsx";
import { TextArea } from "../FormFields/TextArea.jsx";
import { PanelTitle } from "./PanelTitle.jsx";

export function LeftPanel({
  form,
  updateForm,
  heroes,
  rawText,
  setRawText,
  segments,
  selectedSegmentId,
  setSelectedSegmentId,
  setTool,
  updateFooterLayer,
  runParser,
  autoPlaceAllSegments,
  segmentsOpen,
  setSegmentsOpen,
}) {
  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden p-3">
      <PanelTitle
        title="Paste review"
        subtitle="Bot JSON or pasted raw review text."
      />

      <div className="panel mt-3">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Field label="Player" value={form.player} onChange={(v) => updateForm("player", v)} />
          <Field label="Coach" value={form.reviewer} onChange={(v) => updateForm("reviewer", v)} />
        </div>

        <Field label="Replay ID" value={form.replayId} onChange={(v) => updateForm("replayId", v)} />

        <button className="btn-secondary mt-4 mb-3 w-full" onClick={updateFooterLayer}>
          Update footer info
        </button>

        <label>
          <Label>Hero template</Label>
          <select className="input" value={form.hero} onChange={(e) => updateForm("hero", e.target.value)}>
            {heroes.map((hero) => (
              <option key={hero}>{hero}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="panel mt-3">
        <Label>Raw Discord text fallback</Label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="input min-h-40 resize-y font-mono text-xs"
        />

        <button className="btn-primary mt-3 w-full" onClick={runParser}>
          <RefreshCcw size={16} /> Parse fallback text
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          className="flex min-w-0 flex-1 items-center justify-between rounded-xl px-2 py-1 text-left hover:bg-slate-800"
          onClick={() => setSegmentsOpen((v) => !v)}
          title={segmentsOpen ? "Collapse segments" : "Expand segments"}
        >
          <div>
            <p className="font-black">Segments</p>
            <p className="text-sm text-slate-400">{segments.length} blocks</p>
          </div>

          <span className="text-lg text-slate-400">
            {segmentsOpen ? "▾" : "▸"}
          </span>
        </button>

        <button className="btn-secondary px-3" onClick={autoPlaceAllSegments}>
          Auto-place all
        </button>
      </div>

      {segmentsOpen && (
        <div className="mt-2 space-y-2">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => {
                setSelectedSegmentId(segment.id);
                setTool("insertText");
              }}
              className={`w-full rounded-xl border p-3 text-left transition ${selectedSegmentId === segment.id
                  ? "border-blue-400 bg-blue-600/25"
                  : segment.used
                    ? "border-slate-700 bg-slate-900 opacity-45 grayscale"
                    : "border-slate-800 bg-slate-950 hover:border-slate-600"
                }`}
            >
              <div className="mb-1 flex justify-between gap-2">
                <span className="text-xs font-black uppercase text-blue-200">
                  {segment.type}
                </span>
                {segment.timestamp && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs">
                    {segment.timestamp}
                  </span>
                )}
              </div>

              <p className="text-sm font-bold">{segment.title}</p>
              <p className="mt-1 line-clamp-3 text-xs text-slate-400">
                {segment.text}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
