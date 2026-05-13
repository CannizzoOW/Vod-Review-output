import { useMemo, useState } from "react";
import { SmilePlus } from "lucide-react";
import { RIVALS_EMOJIS, RIVALS_EMOJI_SOURCE } from "../../utils/rivalsEmojis.js";

export function EmojiPicker({ onAddEmoji }) {
  const [query, setQuery] = useState("");

  const filteredEmojis = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return RIVALS_EMOJIS;

    return RIVALS_EMOJIS.filter((emoji) =>
      emoji.name.toLowerCase().includes(cleanQuery)
    );
  }, [query]);

  return (
    <div className="panel mt-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-black">Rivals emojis</p>
          <p className="text-xs text-slate-400">
            {filteredEmojis.length} of {RIVALS_EMOJIS.length}
          </p>
        </div>

        <a
          href={RIVALS_EMOJI_SOURCE}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg px-2 py-1 text-xs font-bold text-blue-200 hover:bg-slate-800"
        >
          Source
        </a>
      </div>

      <input
        className="input"
        value={query}
        placeholder="Search emojis"
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-3 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1">
        {filteredEmojis.map((emoji) => (
          <button
            key={emoji.id}
            className="group flex aspect-square items-center justify-center rounded-lg border border-slate-800 bg-slate-950 p-1 hover:border-blue-400 hover:bg-slate-800"
            onClick={() => onAddEmoji(emoji)}
            title={`Add ${emoji.name}`}
          >
            <img
              src={emoji.src}
              alt={emoji.name}
              className="h-full w-full object-contain transition group-hover:scale-110"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {!filteredEmojis.length && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-950 p-3 text-sm text-slate-400">
          <SmilePlus size={16} />
          No emojis found.
        </div>
      )}
    </div>
  );
}
