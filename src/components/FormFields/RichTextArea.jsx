import { useRef } from "react";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
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

  function wrapSelection(before, after = before, fallback = "text") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
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

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
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

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-2">
          <button className="tool-btn" onClick={() => wrapSelection("**")} title="Bold">
            <Bold size={16} />
          </button>
          <button className="tool-btn" onClick={() => wrapSelection("*")} title="Italic">
            <Italic size={16} />
          </button>
          <button className="tool-btn" onClick={() => prefixLines("## ")} title="Heading">
            <Heading2 size={16} />
          </button>
          <button className="tool-btn" onClick={() => prefixLines("- ")} title="Bulleted list">
            <List size={16} />
          </button>
          <button className="tool-btn" onClick={() => prefixLines("1. ")} title="Numbered list">
            <ListOrdered size={16} />
          </button>
          <button className="tool-btn" onClick={() => prefixLines("> ")} title="Quote">
            <Quote size={16} />
          </button>
        </div>

        <label className="block">
          <Label>{label}</Label>
          <textarea
            ref={textareaRef}
            className={`input ${minHeight} resize-y font-mono text-sm`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <Label>{previewTitle}</Label>
        <div className="vod-text max-h-96 min-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-sm text-slate-200">
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
