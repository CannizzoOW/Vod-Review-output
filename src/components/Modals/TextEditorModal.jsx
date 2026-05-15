import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Label } from "../FormFields/Label.jsx";

function clampWeight(value) {
  return Math.max(100, Math.min(1000, Number(value) || 500));
}

function clampFontSize(value) {
  return Math.max(8, Math.min(120, Number(value) || 18));
}

function getTextDecoration(layer) {
  return [
    layer.underline ? "underline" : "",
    layer.strikethrough ? "line-through" : "",
  ].filter(Boolean).join(" ") || "none";
}

function inferSegmentType(layer) {
  if (layer.segmentType) return layer.segmentType;
  if (layer.sourceSegmentId && layer.timestampGutter === 0 && layer.fontSize >= 24 && layer.weight >= 800) {
    return "heading";
  }

  return "paragraph";
}

function hexToRgba(hex, opacity = 1) {
  const value = String(hex || "").replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((char) => char + char).join("")
    : value;

  if (normalized.length !== 6) return `rgba(239, 234, 231, ${opacity})`;

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export function TextEditorModal({
  layer,
  previewBackgroundLayer,
  appendableSegments = [],
  onAppendToSegment,
  onCreateSegment,
  onClose,
  onSave,
}) {
  const textareaRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [draft, setDraft] = useState(() => ({ ...layer }));
  const previewBackgroundColor = previewBackgroundLayer
    ? hexToRgba(previewBackgroundLayer.fillColor, previewBackgroundLayer.fillOpacity ?? 1)
    : "#efeae7";
  const isPageTitle = layer.id === "page-title";
  const isHeading = inferSegmentType(draft) === "heading";
  const canManageSegment = !isPageTitle && !layer.sourceSegmentId;
  const [appendSegmentId, setAppendSegmentId] = useState("");

  function update(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function rememberSelection() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    selectionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }

  function keepTextareaSelection(e) {
    e.preventDefault();
    textareaRef.current?.focus();
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

  function wrapSelection(before, after = before, placeholder = "text") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = draft.text || "";
    const { start, end } = selectionRef.current;
    const selectedText = text.slice(start, end) || placeholder;
    const nextText =
      text.slice(0, start) +
      before +
      selectedText +
      after +
      text.slice(end);

    update({ text: nextText, markdown: true });

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    });
  }

  function prefixLines(prefix) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = draft.text || "";
    const { start, end } = selectionRef.current;
    const selectedText = text.slice(start, end) || "Text";
    const nextSelectedText = selectedText
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");

    const nextText =
      text.slice(0, start) +
      nextSelectedText +
      text.slice(end);

    update({ text: nextText, markdown: true });

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + nextSelectedText.length);
    });
  }

  function setHeadingStyle() {
    const nextText = String(draft.text || "").trim();

    update({
      segmentType: "heading",
      text: nextText ? nextText.toUpperCase() : draft.text,
      timestamp: "",
      timestampGutter: 0,
      fontSize: Math.max(28, Number(draft.fontSize) || 28),
      weight: Math.max(900, clampWeight(draft.weight)),
      markdown: false,
    });
  }

  function adjustFontSize(delta) {
    update({ fontSize: clampFontSize((Number(draft.fontSize) || 18) + delta) });
  }

  function save() {
    onSave(layer.id, {
      text: draft.text,
      color: draft.color,
      fontSize: draft.fontSize,
      weight: clampWeight(draft.weight),
      italic: draft.italic,
      underline: draft.underline,
      strikethrough: draft.strikethrough,
      align: draft.align,
      markdown: draft.markdown,
      segmentType: inferSegmentType(draft),
      timestamp: draft.timestamp,
      timestampGutter: draft.timestampGutter,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-blue-300">
              Text Editor
            </p>
            <h2 className="mt-1 text-2xl font-black">Edit Text Layer</h2>
          </div>

          <button
            type="button"
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            title="Close editor"
          >
            x
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-2">
                <button type="button" className="tool-btn" onMouseDown={keepTextareaSelection} onClick={() => wrapSelection("**")} title="Bold">
                  <Bold size={16} />
                </button>
                <button type="button" className="tool-btn" onMouseDown={keepTextareaSelection} onClick={() => wrapSelection("*")} title="Italic">
                  <Italic size={16} />
                </button>
                <button
                  type="button"
                  className={`tool-btn ${draft.underline ? "tool-btn-active" : ""}`}
                  onMouseDown={keepTextareaSelection}
                  onClick={() => update({ underline: !draft.underline })}
                  title="Underline"
                >
                  <Underline size={16} />
                </button>
                <button
                  type="button"
                  className={`tool-btn ${draft.strikethrough ? "tool-btn-active" : ""}`}
                  onMouseDown={keepTextareaSelection}
                  onClick={() => update({ strikethrough: !draft.strikethrough })}
                  title="Strikethrough"
                >
                  <Strikethrough size={16} />
                </button>
                <button
                  type="button"
                  className={`tool-btn ${isHeading ? "tool-btn-active" : ""}`}
                  onMouseDown={keepTextareaSelection}
                  onClick={setHeadingStyle}
                  title="Heading"
                >
                  <Heading2 size={16} />
                </button>
                <button type="button" className="tool-btn" onMouseDown={keepTextareaSelection} onClick={() => prefixLines("- ")} title="Bulleted list">
                  <List size={16} />
                </button>
                <button type="button" className="tool-btn" onMouseDown={keepTextareaSelection} onClick={() => prefixLines("1. ")} title="Numbered list">
                  <ListOrdered size={16} />
                </button>
                <button type="button" className="tool-btn" onMouseDown={keepTextareaSelection} onClick={() => prefixLines("> ")} title="Quote">
                  <Quote size={16} />
                </button>

                <div className="mx-1 w-px bg-slate-800" />

                <div className="flex h-10 items-center rounded-xl border border-slate-800 bg-slate-900">
                  <button
                    type="button"
                    className="tool-btn h-9 rounded-r-none px-2"
                    onMouseDown={keepTextareaSelection}
                    onClick={() => adjustFontSize(-1)}
                    title="Decrease font size"
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    className="h-9 w-14 border-x border-slate-800 bg-transparent px-1 text-center text-sm font-bold text-slate-100 outline-none"
                    type="number"
                    min="8"
                    max="120"
                    value={draft.fontSize || 18}
                    onChange={(e) => update({ fontSize: clampFontSize(e.target.value) })}
                    title="Font size"
                  />
                  <button
                    type="button"
                    className="tool-btn h-9 rounded-l-none px-2"
                    onMouseDown={keepTextareaSelection}
                    onClick={() => adjustFontSize(1)}
                    title="Increase font size"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <div className="mx-1 w-px bg-slate-800" />

                <button
                  type="button"
                  className={`tool-btn ${draft.align === "left" || !draft.align ? "tool-btn-active" : ""}`}
                  onClick={() => update({ align: "left" })}
                  title="Align left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  type="button"
                  className={`tool-btn ${draft.align === "center" ? "tool-btn-active" : ""}`}
                  onClick={() => update({ align: "center" })}
                  title="Align center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  type="button"
                  className={`tool-btn ${draft.align === "right" ? "tool-btn-active" : ""}`}
                  onClick={() => update({ align: "right" })}
                  title="Align right"
                >
                  <AlignRight size={16} />
                </button>
              </div>

              <label className="block">
                <Label>Layer Text</Label>
                <textarea
                  ref={textareaRef}
                  className="input min-h-80 resize-y font-mono text-sm"
                  value={draft.text || ""}
                  onChange={(e) => {
                    update({ text: e.target.value });
                    rememberSelection();
                  }}
                  onClick={rememberSelection}
                  onKeyUp={rememberSelection}
                  onSelect={rememberSelection}
                />
              </label>
            </div>

            <div className="space-y-3">
              {canManageSegment && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <Label>Segment</Label>
                  {appendableSegments.length > 0 && (
                    <>
                      <select
                        className="input mt-1"
                        value={appendSegmentId}
                        onChange={(e) => setAppendSegmentId(e.target.value)}
                      >
                        <option value="">Choose segment</option>
                        {appendableSegments.map((segment) => (
                          <option key={segment.id} value={segment.id}>
                            {segment.title || segment.section || segment.type}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-secondary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={!appendSegmentId || !String(draft.text || "").trim()}
                        onClick={() => onAppendToSegment?.(appendSegmentId, draft.text)}
                      >
                        Append to segment
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn-secondary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!String(draft.text || "").trim()}
                    onClick={() => onCreateSegment?.(draft.text)}
                  >
                    Make new segment
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <Label>Preview</Label>
                <div
                  className={`vod-text whitespace-pre-wrap rounded-xl p-4 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] ${
                    isPageTitle ? "min-h-[70px]" : "min-h-48"
                  }`}
                  style={{
                    backgroundColor: previewBackgroundColor,
                    color: draft.color || "#000000",
                    fontSize: `${draft.fontSize}px`,
                    fontWeight: draft.weight,
                    fontStyle: draft.italic ? "italic" : "normal",
                    textDecoration: getTextDecoration(draft),
                    lineHeight: 1.25,
                    textAlign: draft.align || "left",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {draft.markdown ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {draft.text || ""}
                    </ReactMarkdown>
                  ) : (
                    draft.text
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 p-5">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            Save Text
          </button>
        </div>
      </div>
    </div>
  );
}
