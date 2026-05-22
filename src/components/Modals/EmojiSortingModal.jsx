import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, RotateCcw, X } from "lucide-react";
import { HEROES } from "../../utils/constants.js";
import { RIVALS_EMOJIS } from "../../utils/rivalsEmojis.js";
import { UNIVERSAL_EMOJI_CHARACTER } from "../../utils/emojiCharacters.js";

export function EmojiSortingModal({
  emojiCharacterMap,
  overrides,
  onChangeOverrides,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedEmojiIds, setSelectedEmojiIds] = useState([]);
  const [batchCharacter, setBatchCharacter] = useState("");
  const [viewMode, setViewMode] = useState("remaining");
  const [previewEmoji, setPreviewEmoji] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const unresolvedEmojis = useMemo(
    () =>
      RIVALS_EMOJIS.filter((emoji) => (
        emojiCharacterMap.get(emoji.id) || UNIVERSAL_EMOJI_CHARACTER
      ) === UNIVERSAL_EMOJI_CHARACTER),
    [emojiCharacterMap]
  );
  const baseEmojis = useMemo(() => {
    if (viewMode === "all") return RIVALS_EMOJIS;
    if (viewMode === "mapped") {
      return RIVALS_EMOJIS.filter((emoji) => (
        emojiCharacterMap.get(emoji.id) || UNIVERSAL_EMOJI_CHARACTER
      ) !== UNIVERSAL_EMOJI_CHARACTER);
    }

    return unresolvedEmojis;
  }, [emojiCharacterMap, unresolvedEmojis, viewMode]);
  const visibleEmojis = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return baseEmojis;

    return baseEmojis.filter((emoji) =>
      `${emoji.name} ${emoji.src} ${emoji.remoteSrc || ""}`.toLowerCase().includes(cleanQuery)
    );
  }, [baseEmojis, query]);
  const overrideText = useMemo(
    () => `export const EMOJI_CHARACTER_OVERRIDES = ${JSON.stringify(overrides, null, 2)};\n`,
    [overrides]
  );
  const selectedEmojiIdSet = useMemo(
    () => new Set(selectedEmojiIds),
    [selectedEmojiIds]
  );
  const allVisibleSelected = visibleEmojis.length > 0 &&
    visibleEmojis.every((emoji) => selectedEmojiIdSet.has(emoji.id));

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

  function commitOverrideChange(updater) {
    onChangeOverrides((prev) => {
      setUndoStack((stack) => [...stack, prev].slice(-30));
      return updater(prev);
    });
  }

  function setEmojiCharacter(emojiId, character) {
    commitOverrideChange((prev) => {
      const next = { ...prev };

      if (!character) {
        delete next[emojiId];
      } else {
        next[emojiId] = character;
      }

      return next;
    });
  }

  function toggleSelectedEmoji(emojiId) {
    setSelectedEmojiIds((prev) =>
      prev.includes(emojiId)
        ? prev.filter((id) => id !== emojiId)
        : [...prev, emojiId]
    );
  }

  function toggleVisibleSelection() {
    if (allVisibleSelected) {
      const visibleIds = new Set(visibleEmojis.map((emoji) => emoji.id));
      setSelectedEmojiIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }

    setSelectedEmojiIds((prev) => Array.from(new Set([
      ...prev,
      ...visibleEmojis.map((emoji) => emoji.id),
    ])));
  }

  function clearSelection() {
    setSelectedEmojiIds([]);
  }

  function applyBatchCharacter() {
    if (!selectedEmojiIds.length) return;

    commitOverrideChange((prev) => {
      const next = { ...prev };

      for (const emojiId of selectedEmojiIds) {
        if (!batchCharacter) {
          delete next[emojiId];
        } else {
          next[emojiId] = batchCharacter;
        }
      }

      return next;
    });
    setSelectedEmojiIds([]);
  }

  function undoLastChange() {
    setUndoStack((stack) => {
      const previous = stack[stack.length - 1];

      if (!previous) return stack;

      onChangeOverrides(previous);
      return stack.slice(0, -1);
    });
  }

  async function copyOverrides() {
    await navigator.clipboard.writeText(overrideText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-blue-300">Emoji sorting</p>
            <h2 className="mt-1 text-2xl font-black">Sort remaining emojis</h2>
            <p className="mt-2 text-sm text-slate-400">
              {unresolvedEmojis.length} emojis are still in Universal / Other.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            title="Close emoji sorting"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-hidden p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search remaining emojis"
            />

            <div className="mt-3 grid gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:grid-cols-[160px_auto_auto]">
              <select
                className="input"
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value);
                  clearSelection();
                }}
              >
                <option value="remaining">Remaining only</option>
                <option value="mapped">Mapped only</option>
                <option value="all">All emojis</option>
              </select>

              <button className="btn-secondary px-3" onClick={toggleVisibleSelection}>
                {allVisibleSelected ? "Clear visible" : "Select visible"}
              </button>

              <button
                className="btn-secondary px-3 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedEmojiIds.length}
                onClick={clearSelection}
              >
                Clear selection
              </button>
            </div>

            <div className="mt-2 grid gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <select
                className="input"
                value={batchCharacter}
                onChange={(e) => setBatchCharacter(e.target.value)}
              >
                <option value="">Universal / Other</option>
                {HEROES.map((hero) => (
                  <option key={hero} value={hero}>{hero}</option>
                ))}
              </select>

              <button
                className="btn-primary px-3 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedEmojiIds.length}
                onClick={applyBatchCharacter}
              >
                Assign {selectedEmojiIds.length || ""}
              </button>

              <button
                className="btn-secondary px-3 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!undoStack.length}
                onClick={undoLastChange}
              >
                <RotateCcw size={15} />
                Undo
              </button>
            </div>

            <div className="mt-3 max-h-[62vh] space-y-2 overflow-y-auto pr-1">
              {visibleEmojis.map((emoji) => (
                <div
                  key={emoji.id}
                  role="button"
                  tabIndex={0}
                  className={`grid items-center gap-3 rounded-2xl border p-3 sm:grid-cols-[auto_64px_minmax(0,1fr)_220px] ${
                    selectedEmojiIdSet.has(emoji.id)
                      ? "border-blue-400 bg-blue-600/15"
                      : "border-slate-800 bg-slate-950"
                  }`}
                  onClick={() => toggleSelectedEmoji(emoji.id)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    toggleSelectedEmoji(emoji.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmojiIdSet.has(emoji.id)}
                    onChange={() => toggleSelectedEmoji(emoji.id)}
                    onClick={(e) => e.stopPropagation()}
                    title={`Select ${emoji.name}`}
                  />

                  <button
                    type="button"
                    className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-1 hover:border-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewEmoji(emoji);
                    }}
                    title={`Preview ${emoji.name}`}
                  >
                    <img src={emoji.src} alt={emoji.name} className="h-full w-full object-contain" loading="lazy" />
                  </button>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-100">{emoji.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{emoji.src}</p>
                    <p className="mt-1 text-xs text-slate-600">ID {emoji.id}</p>
                  </div>

                  <select
                    className="input"
                    value={overrides[emoji.id] || ""}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEmojiCharacter(emoji.id, e.target.value)}
                  >
                    <option value="">Universal / Other</option>
                    {HEROES.map((hero) => (
                      <option key={hero} value={hero}>{hero}</option>
                    ))}
                  </select>
                </div>
              ))}

              {!visibleEmojis.length && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
                  No remaining emojis match that search.
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-100">Overrides</p>
                <p className="mt-1 text-xs text-slate-400">{Object.keys(overrides).length} manual assignments</p>
              </div>

              <button className="btn-secondary px-3" onClick={copyOverrides}>
                {copied ? <Check size={15} /> : <Clipboard size={15} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <textarea
              className="input mt-3 h-[52vh] resize-none font-mono text-xs"
              readOnly
              value={overrideText}
            />
          </div>
        </div>

        {previewEmoji && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/75 p-6">
            <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-blue-300">Emoji preview</p>
                  <h3 className="mt-1 text-xl font-black text-slate-100">{previewEmoji.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">ID {previewEmoji.id}</p>
                </div>

                <button
                  type="button"
                  className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                  onClick={() => setPreviewEmoji(null)}
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex aspect-square items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-8">
                <img
                  src={previewEmoji.src}
                  alt={previewEmoji.name}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
