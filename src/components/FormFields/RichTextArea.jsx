import { useRef, useState } from "react";
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
import { Label } from "./Label.jsx";

export function RichTextArea({
  label,
  value,
  onChange,
  placeholder,
  minHeight = "min-h-56",
  previewTitle = "Preview",
}) {
  const textareaRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [previewStyle, setPreviewStyle] = useState({
    align: "left",
    color: "#e2e8f0",
    fontSize: 14,
    underline: false,
    strikethrough: false,
  });

  function updatePreviewStyle(patch) {
    setPreviewStyle((prev) => ({ ...prev, ...patch }));
  }

  function clampFontSize(value) {
    return Math.max(8, Math.min(120, Number(value) || 14));
  }

  function adjustFontSize(delta) {
    updatePreviewStyle({
      fontSize: clampFontSize(previewStyle.fontSize + delta),
    });
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

  function wrapSelection(before, after = before, fallback = "text") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end } = selectionRef.current;
    const selectedText = value.slice(start, end) || fallback;
    const nextValue =
      value.slice(0, start) +
      before +
      selectedText +
      after +
      value.slice(end);

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    });
  }

  function prefixLines(prefix) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end } = selectionRef.current;
    const selectedText = value.slice(start, end) || "Text";
    const nextSelectedText = selectedText
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    const nextValue =
      value.slice(0, start) +
      nextSelectedText +
      value.slice(end);

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + nextSelectedText.length);
    });
  }

  const previewTextDecoration = [
    previewStyle.underline ? "underline" : "",
    previewStyle.strikethrough ? "line-through" : "",
  ].filter(Boolean).join(" ") || "none";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
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
            className={`tool-btn ${previewStyle.underline ? "tool-btn-active" : ""}`}
            onMouseDown={keepTextareaSelection}
            onClick={() => updatePreviewStyle({ underline: !previewStyle.underline })}
            title="Underline preview"
          >
            <Underline size={16} />
          </button>
          <button type="button" className="tool-btn" onMouseDown={keepTextareaSelection} onClick={() => wrapSelection("~~")} title="Strikethrough">
            <Strikethrough size={16} />
          </button>
          <button type="button" className="tool-btn" onMouseDown={keepTextareaSelection} onClick={() => prefixLines("## ")} title="Heading">
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
              title="Decrease preview font size"
            >
              <Minus size={15} />
            </button>
            <input
              className="h-9 w-14 border-x border-slate-800 bg-transparent px-1 text-center text-sm font-bold text-slate-100 outline-none"
              type="number"
              min="8"
              max="120"
              value={previewStyle.fontSize}
              onChange={(e) => updatePreviewStyle({ fontSize: clampFontSize(e.target.value) })}
              title="Preview font size"
            />
            <button
              type="button"
              className="tool-btn h-9 rounded-l-none px-2"
              onMouseDown={keepTextareaSelection}
              onClick={() => adjustFontSize(1)}
              title="Increase preview font size"
            >
              <Plus size={15} />
            </button>
          </div>

          <label className="flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white">
            <span>Color</span>
            <input
              type="color"
              className="h-7 w-8 cursor-pointer rounded border border-slate-700 bg-transparent p-0"
              value={previewStyle.color}
              onMouseDown={keepTextareaSelection}
              onChange={(e) => updatePreviewStyle({ color: e.target.value })}
              title="Preview color"
            />
          </label>

          <div className="mx-1 w-px bg-slate-800" />

          <button
            type="button"
            className={`tool-btn ${previewStyle.align === "left" ? "tool-btn-active" : ""}`}
            onClick={() => updatePreviewStyle({ align: "left" })}
            title="Align preview left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            className={`tool-btn ${previewStyle.align === "center" ? "tool-btn-active" : ""}`}
            onClick={() => updatePreviewStyle({ align: "center" })}
            title="Align preview center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            className={`tool-btn ${previewStyle.align === "right" ? "tool-btn-active" : ""}`}
            onClick={() => updatePreviewStyle({ align: "right" })}
            title="Align preview right"
          >
            <AlignRight size={16} />
          </button>
        </div>

        <label className="block">
          <Label>{label}</Label>
          <textarea
            ref={textareaRef}
            className={`input ${minHeight} resize-y font-mono text-sm`}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              rememberSelection();
            }}
            onClick={rememberSelection}
            onKeyUp={rememberSelection}
            onSelect={rememberSelection}
            placeholder={placeholder}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <Label>{previewTitle}</Label>
        <div
          className="vod-text max-h-96 min-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4"
          style={{
            color: previewStyle.color,
            fontSize: `${previewStyle.fontSize}px`,
            textAlign: previewStyle.align,
            textDecoration: previewTextDecoration,
          }}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value}
            </ReactMarkdown>
          ) : (
            <span className="text-slate-500">Nothing to preview yet.</span>
          )}
        </div>
      </div>
    </div>
  );
}
