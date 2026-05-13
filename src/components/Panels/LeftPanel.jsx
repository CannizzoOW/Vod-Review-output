import { EmojiPicker } from "./EmojiPicker.jsx";

export function LeftPanel({
  segments,
  selectedSegmentId,
  setSelectedSegmentId,
  setTool,
  autoPlaceAllSegments,
  onAddEmoji,
  segmentsOpen,
  setSegmentsOpen,
}) {
  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden p-3">
      <div className="panel">
        <p className="text-xs font-black uppercase tracking-wide text-blue-200">
          Credits
        </p>

        <div className="mt-3 space-y-3">

          <a
            href="https://linktr.ee/CannizzoOW"
            target="_blank"
            rel="noreferrer"
            className="group relative block h-36 overflow-hidden rounded-2xl border border-slate-800"
          >
            <img
              src="https://linktr.ee/og/image/CannizzoOW.jpg"
              alt="CannizzoOW"
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-0" />

            <div className="absolute bottom-0 left-0 p-4 transition-opacity duration-300 group-hover:opacity-0">
              <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                Programming
              </p>

              <p className="text-lg font-black text-white">
                CannizzoOW
              </p>
            </div>
          </a>

          <a
            href="https://linktr.ee/yupina"
            target="_blank"
            rel="noreferrer"
            className="group relative block h-36 overflow-hidden rounded-2xl border border-slate-800"
          >
            <img
              src="https://linktr.ee/og/image/yupina.jpg"
              alt="yupina"
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-0" />

            <div className="absolute bottom-0 left-0 p-4 transition-opacity duration-300 group-hover:opacity-0">
              <p className="text-xs font-black uppercase tracking-wider text-pink-300">
                Templates
              </p>

              <p className="text-lg font-black text-white">
                Yupina
              </p>
            </div>
          </a>

        </div>
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

      <EmojiPicker onAddEmoji={onAddEmoji} />
    </div>
  );
}
