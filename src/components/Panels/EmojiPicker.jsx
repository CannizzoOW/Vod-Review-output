import { useEffect, useMemo, useState } from "react";
import { SmilePlus, Star } from "lucide-react";
import { RIVALS_EMOJIS, RIVALS_EMOJI_SOURCE } from "../../utils/rivalsEmojis.js";

const FAVORITE_EMOJIS_KEY = "rivals-vod-review-favorite-emojis";

export function EmojiPicker({ onAddEmoji }) {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteEmojiIds, setFavoriteEmojiIds] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITE_EMOJIS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const favoriteEmojiIdSet = useMemo(
    () => new Set(favoriteEmojiIds),
    [favoriteEmojiIds]
  );

  const filteredEmojis = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const source = favoritesOnly
      ? RIVALS_EMOJIS.filter((emoji) => favoriteEmojiIdSet.has(emoji.id))
      : RIVALS_EMOJIS;

    if (!cleanQuery) return source;

    return source.filter((emoji) =>
      emoji.name.toLowerCase().includes(cleanQuery)
    );
  }, [favoriteEmojiIdSet, favoritesOnly, query]);

  useEffect(() => {
    localStorage.setItem(FAVORITE_EMOJIS_KEY, JSON.stringify(favoriteEmojiIds));
  }, [favoriteEmojiIds]);

  function toggleFavoriteEmoji(emojiId) {
    setFavoriteEmojiIds((prev) =>
      prev.includes(emojiId)
        ? prev.filter((id) => id !== emojiId)
        : [...prev, emojiId]
    );
  }

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

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          className={`tool-btn flex-1 ${favoritesOnly ? "tool-btn-active" : ""}`}
          onClick={() => setFavoritesOnly((value) => !value)}
          title={favoritesOnly ? "Show all emojis" : "Show favorite emojis"}
        >
          <Star size={15} fill={favoritesOnly ? "currentColor" : "none"} />
          Favorites
        </button>

        <p className="text-xs text-slate-400">
          {favoriteEmojiIds.length} saved
        </p>
      </div>

      <div className="mt-3 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1">
        {filteredEmojis.map((emoji) => {
          const isFavorite = favoriteEmojiIdSet.has(emoji.id);

          return (
            <div
              key={emoji.id}
              className="group relative aspect-square rounded-lg border border-slate-800 bg-slate-950 hover:border-blue-400 hover:bg-slate-800"
            >
              <button
                className="flex h-full w-full items-center justify-center p-1"
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

              <button
                className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border text-xs shadow ${
                  isFavorite
                    ? "border-yellow-300 bg-yellow-400 text-slate-950"
                    : "border-slate-700 bg-slate-950/90 text-slate-300 opacity-0 hover:text-yellow-200 group-hover:opacity-100"
                }`}
                onClick={() => toggleFavoriteEmoji(emoji.id)}
                title={isFavorite ? "Remove favorite" : "Add favorite"}
              >
                <Star size={13} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>
          );
        })}
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
