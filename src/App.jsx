import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ClipboardList,
  Download,
  FileInput,
  ImagePlus,
  LayoutGrid,
  MousePointer2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import heroTemplates from "./data/heroTemplates.json";

const PAGE_W = 1080;
const PAGE_H = 1527;
const HEROES = Object.keys(heroTemplates);
const fallbackTemplate = `${import.meta.env.BASE_URL}templates/default.png`;

const DEFAULT_SAFE_ZONES = [
  {
    id: "mainText",
    label: "Main text",
    x: 10,
    y: 450,
    w: 670,
    h: 940,
    layout: "flow",
    padding: 28,
    gap: 18,
  },
  {
    id: "rightMedia",
    label: "Screenshots",
    x: 700,
    y: 450,
    w: 360,
    h: 940,
    layout: "stack",
    padding: 16,
    gap: 16,
  },
  {
    id: "footerSafe",
    label: "Footer",
    x: 0,
    y: 1450,
    w: 1080,
    h: 70,
    layout: "fixed",
    padding: 10,
    gap: 10,
  },
];

const SAMPLE_REVIEW = `Replay ID: 10903088673

Abilities
Dagger Storm is a very useful ability for creating space, but you’re not using it often enough.

• 1:42 This would be a better time to use bubble instead of veil of light.
• Around 3:00 onward, it looks like you start to panic and spam abilities.

Teleport
You use Cloak teleport to reposition, which is good.
• 5:03 As shown here, Venom targets you within 1–2 seconds and eliminates you.

Ult Usage
Always ult as Cloak, not Dagger.`;

function uid() {
  return crypto.randomUUID();
}

function extractTimestamp(text) {
  const match = text.match(/\b(?:around\s*)?(\d{1,2}:\d{2})\b/i);
  return match ? match[1] : "";
}

function parseDiscordReview(raw) {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const segments = [];
  let section = "General";
  let replayId = "";
  let paragraph = [];

  function flush() {
    if (!paragraph.length) return;

    const text = paragraph.join(" ");

    segments.push({
      id: uid(),
      type: "paragraph",
      title: section,
      section,
      timestamp: extractTimestamp(text),
      text,
      used: false,
    });

    paragraph = [];
  }

  for (const line of lines) {
    const replay = line.match(/Replay ID:\s*(\d+)/i);

    if (replay) {
      replayId = replay[1];
      continue;
    }

    const clean = line.replace(/^[-•*]\s*/, "").trim();
    const isBullet = /^[-•*]\s*/.test(line);
    const hasTime = extractTimestamp(line);

    const isHeading =
      clean.length <= 35 &&
      !/[.!?]$/.test(clean) &&
      !hasTime &&
      !clean.includes(":");

    if (isHeading) {
      flush();
      section = clean;

      segments.push({
        id: uid(),
        type: "heading",
        title: clean,
        section,
        timestamp: "",
        text: clean,
        used: false,
      });

      continue;
    }

    if (isBullet || hasTime) {
      flush();

      segments.push({
        id: uid(),
        type: "timestamp_note",
        title: section,
        section,
        timestamp: extractTimestamp(line),
        text: clean,
        used: false,
      });

      continue;
    }

    paragraph.push(line);
  }

  flush();
  return { replayId, segments };
}

function makeTextLayer(segment, x = 80, y = 380) {
  return {
    id: uid(),
    kind: "text",
    sourceSegmentId: segment.id,
    x,
    y,
    w: segment.type === "heading" ? 420 : 560,
    h: segment.type === "heading" ? 55 : 130,
    fontSize: segment.type === "heading" ? 28 : 18,
    weight: segment.type === "heading" ? 900 : 500,
    italic: false,
    markdown: true,
    autoFlow: false,
    zoneId: null,
    text:
      segment.type === "heading"
        ? segment.text.toUpperCase()
        : `${segment.timestamp ? `${segment.timestamp} — ` : ""}${segment.text}`,
  };
}

function makeImageLayer(src, x = 700, y = 420) {
  return {
    id: uid(),
    kind: "image",
    x,
    y,
    w: 330,
    h: 230,
    src,
    caption: "Screenshot note",
  };
}

function snap(value, grid) {
  return Math.round(value / grid) * grid;
}

function estimateTextHeight(text, width, fontSize) {
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(18, Math.floor(width / avgCharWidth));
  const lineCount = Math.ceil(text.length / charsPerLine);

  return Math.max(fontSize * 2.2, lineCount * fontSize * 1.45);
}

function clampToZones(layer, safeZones) {
  const zone =
    layer.kind === "image"
      ? safeZones.find((z) => z.id === "rightMedia") || safeZones[0]
      : safeZones.find((z) => z.id === "mainText") || safeZones[0];

  if (!zone) return layer;

  return {
    ...layer,
    x: Math.min(Math.max(layer.x, zone.x), zone.x + zone.w - layer.w),
    y: Math.min(Math.max(layer.y, zone.y), zone.y + zone.h - layer.h),
  };
}

function autoPlaceInZone({ segment, zone, layers }) {
  const padding = zone.padding || 20;
  const gap = zone.gap || 16;

  const zoneLayers = layers.filter(
    (layer) => layer.zoneId === zone.id && layer.kind === "text"
  );

  const width = zone.w - padding * 2;

  let y = zone.y + padding;

  for (const layer of zoneLayers) {
    y = Math.max(y, layer.y + layer.h + gap);
  }

  const layer = makeTextLayer(segment, zone.x + padding, y);

  layer.zoneId = zone.id;
  layer.autoFlow = true;
  layer.w = width;
  layer.h = estimateTextHeight(layer.text, width, layer.fontSize);

  return layer;
}

export default function App() {
  const firstHero = HEROES[0] || "Cloak & Dagger";
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [rawText, setRawText] = useState(SAMPLE_REVIEW);
  const [segments, setSegments] = useState(
    () => parseDiscordReview(SAMPLE_REVIEW).segments
  );
  const [selectedSegmentId, setSelectedSegmentId] = useState(null);

  const [form, setForm] = useState({
    player: "rockstarcobra9",
    hero: firstHero,
    reviewer: "Phimmiezz",
    replayId: "10903088673",
    requestId: "",
  });

  const firstPage = useMemo(() => ({ id: uid(), title: "Page 1", layers: [] }), []);
  const [pages, setPages] = useState([firstPage]);
  const [activePageId, setActivePageId] = useState(firstPage.id);

  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [safeZones, setSafeZones] = useState(DEFAULT_SAFE_ZONES);
  const [selectedSafeZoneId, setSelectedSafeZoneId] = useState(null);

  const [tool, setTool] = useState("select");
  const [zoom, setZoom] = useState(0.9);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [pageTabsOpen, setPageTabsOpen] = useState(true);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [lockToRegions, setLockToRegions] = useState(false);
  const [pendingImage, setPendingImage] = useState("");

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);
  const selectedLayer = activePage?.layers.find((l) => l.id === selectedLayerId);
  const selectedSafeZone = safeZones.find((z) => z.id === selectedSafeZoneId);

  const templateBackground = useMemo(() => {
    const template = heroTemplates[form.hero]?.template;
    if (!template) return fallbackTemplate;
    return `${import.meta.env.BASE_URL}${template.replace(/^\/+/, "")}`;
  }, [form.hero]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateActivePageLayers(updater) {
    setPages((prev) =>
      prev.map((page) =>
        page.id === activePageId ? { ...page, layers: updater(page.layers) } : page
      )
    );
  }

  function setLayer(layerId, patch) {
    updateActivePageLayers((layers) =>
      layers.map((layer) => {
        if (layer.id !== layerId) return layer;

        let next = { ...layer, ...patch };

        if (next.kind === "text" && next.autoFlow) {
          next.h = estimateTextHeight(next.text, next.w, next.fontSize);
        }

        if (gridEnabled) {
          next.x = snap(next.x, 10);
          next.y = snap(next.y, 10);
          next.w = snap(next.w, 10);
          next.h = snap(next.h, 10);
        }

        if (lockToRegions) {
          next = clampToZones(next, safeZones);
        }

        return next;
      })
    );
  }

  function setSafeZone(zoneId, patch) {
    setSafeZones((prev) =>
      prev.map((zone) => {
        if (zone.id !== zoneId) return zone;

        let next = { ...zone, ...patch };

        if (gridEnabled) {
          next.x = snap(next.x, 10);
          next.y = snap(next.y, 10);
          next.w = snap(next.w, 10);
          next.h = snap(next.h, 10);
        }

        return next;
      })
    );
  }

  function markSegmentUsed(id, used) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, used } : s)));
  }

  function addLayer(layer) {
    let next = layer;

    if (gridEnabled) {
      next = {
        ...next,
        x: snap(next.x, 10),
        y: snap(next.y, 10),
      };
    }

    if (lockToRegions) {
      next = clampToZones(next, safeZones);
    }

    updateActivePageLayers((layers) => [...layers, next]);
    setSelectedLayerId(next.id);
    setSelectedSafeZoneId(null);
  }

  function removeLayer(id) {
    const layer = activePage.layers.find((l) => l.id === id);

    updateActivePageLayers((layers) => layers.filter((l) => l.id !== id));

    if (layer?.sourceSegmentId) {
      markSegmentUsed(layer.sourceSegmentId, false);
    }

    setSelectedLayerId(null);
  }

  function canvasClick(e) {
    if (tool === "select" || tool === "safeZone") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * PAGE_W;
    const y = ((e.clientY - rect.top) / rect.height) * PAGE_H;

    if (tool === "insertText") {
      if (!selectedSegment) return;

      if (selectedSegment.used) {
        const reuse = window.confirm("This segment is already used. Place it again?");
        if (!reuse) return;
      }

      const nearestZone =
        safeZones.find((z) => {
          return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
        }) ||
        safeZones.find((z) => z.id === "mainText") ||
        safeZones[0];

      const layer = autoPlaceInZone({
        segment: selectedSegment,
        zone: nearestZone,
        layers: activePage.layers,
      });

      addLayer(layer);
      markSegmentUsed(selectedSegment.id, true);
      setTool("select");
    }

    if (tool === "insertImage" && pendingImage) {
      addLayer(makeImageLayer(pendingImage, Math.round(x), Math.round(y)));
      setTool("select");
    }
  }

  function autoPlaceSelected() {
    if (!selectedSegment) return;

    if (selectedSegment.used) {
      const reuse = window.confirm("This segment is already used. Place it again?");
      if (!reuse) return;
    }

    const zone = safeZones.find((z) => z.id === "mainText") || safeZones[0];

    const layer = autoPlaceInZone({
      segment: selectedSegment,
      zone,
      layers: activePage.layers,
    });

    addLayer(layer);
    markSegmentUsed(selectedSegment.id, true);
  }

  function runParser() {
    const parsed = parseDiscordReview(rawText);
    setSegments(parsed.segments);

    if (parsed.replayId) {
      updateForm("replayId", parsed.replayId);
    }

    setSelectedSegmentId(parsed.segments[0]?.id || null);
  }

  function importJson(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const request = data.request || data.meta?.request || data.meta || {};
        const coach = data.coach || {};

        setForm((prev) => ({
          ...prev,
          player: request.player || request.username || prev.player,
          hero: request.hero || request.heroes || prev.hero,
          reviewer:
            coach.displayName ||
            coach.username ||
            request.reviewer ||
            prev.reviewer,
          replayId:
            request.replayId ||
            request.replayID ||
            request.replay_id ||
            prev.replayId,
          requestId: request.requestId || request.id || prev.requestId,
        }));

        if (Array.isArray(data.segments)) {
          setSegments(
            data.segments.map((s) => ({
              id: s.id || uid(),
              type: s.type || "paragraph",
              title: s.title || s.section || "General",
              section: s.section || s.title || "General",
              timestamp: s.timestamp || extractTimestamp(s.text || ""),
              text: s.text || "",
              used: false,
            }))
          );
        }

        if (Array.isArray(data.pages)) {
          const importedPages = data.pages.map((p) => ({
            id: p.id || uid(),
            title: p.title || "Page",
            layers: Array.isArray(p.layers) ? p.layers : [],
          }));

          setPages(importedPages);
          setActivePageId(importedPages[0]?.id);
        }

        if (Array.isArray(data.safeZones)) {
          setSafeZones(data.safeZones);
        }

        alert("Review JSON imported.");
      } catch {
        alert("Could not import JSON.");
      }
    };

    reader.readAsText(file);
  }

  function saveDraft() {
    const draft = {
      form,
      segments,
      pages,
      activePageId,
      safeZones,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("rivals-vod-review-draft", JSON.stringify(draft));
    alert("Draft saved locally.");
  }

  function loadDraft() {
    const raw = localStorage.getItem("rivals-vod-review-draft");

    if (!raw) {
      alert("No local draft found.");
      return;
    }

    const draft = JSON.parse(raw);

    setForm(draft.form);
    setSegments(draft.segments || []);
    setPages(draft.pages || []);
    setActivePageId(draft.activePageId || draft.pages?.[0]?.id);
    setSafeZones(draft.safeZones || DEFAULT_SAFE_ZONES);
  }

  function addPage() {
    const page = { id: uid(), title: `Page ${pages.length + 1}`, layers: [] };
    setPages((prev) => [...prev, page]);
    setActivePageId(page.id);
    setSelectedLayerId(null);
    setSelectedSafeZoneId(null);
  }

  function exportPng() {
    alert("PNG export is next step. Layout state is ready.");
  }

  return (
    <div className="h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0f172a] px-4">
        <div>
          <h1 className="text-lg font-black">Rivals VOD Review Editor</h1>
          <p className="text-xs text-slate-500">Import JSON → layout → export</p>
        </div>

        <div className="flex gap-2">
          <button
            className={`btn-secondary ${leftPanelOpen ? "ring-1 ring-blue-400" : ""}`}
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          >
            {leftPanelOpen ? "Hide Left" : "Show Left"}
          </button>

          <button
            className={`btn-secondary ${rightPanelOpen ? "ring-1 ring-blue-400" : ""}`}
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          >
            {rightPanelOpen ? "Hide Right" : "Show Right"}
          </button>

          <button
            className={`btn-secondary ${pageTabsOpen ? "ring-1 ring-blue-400" : ""}`}
            onClick={() => setPageTabsOpen(!pageTabsOpen)}
          >
            {pageTabsOpen ? "Hide Pages" : "Show Pages"}
          </button>

          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <FileInput size={16} /> Import JSON
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importJson(e.target.files?.[0])}
          />

          <button className="btn-secondary" onClick={saveDraft}>
            <Save size={16} /> Save draft
          </button>

          <button className="btn-secondary" onClick={loadDraft}>
            <RefreshCcw size={16} /> Load draft
          </button>

          <button className="btn-primary" onClick={exportPng}>
            <Download size={16} /> Export PNG
          </button>
        </div>
      </header>

      <div
        className="grid h-[calc(100vh-56px)] overflow-hidden transition-all duration-200"
        style={{
          gridTemplateColumns: `${leftPanelOpen ? "330px" : "0px"} minmax(0, 1fr) ${rightPanelOpen ? "320px" : "0px"
            }`,
        }}
      >
        {leftPanelOpen && (
  <aside className="overflow-auto border-r border-slate-800 bg-[#111827] p-3">
    <PanelTitle
      icon={<ClipboardList />}
      title="Imported review"
      subtitle="Bot JSON or pasted raw review text."
    />

          <div className="panel mt-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Player" value={form.player} onChange={(v) => updateForm("player", v)} />
              <Field label="Coach" value={form.reviewer} onChange={(v) => updateForm("reviewer", v)} />
            </div>

            <Field label="Replay ID" value={form.replayId} onChange={(v) => updateForm("replayId", v)} />

            <label>
              <Label>Hero template</Label>
              <select className="input" value={form.hero} onChange={(e) => updateForm("hero", e.target.value)}>
                {HEROES.map((hero) => (
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

          <div className="mt-3 flex items-center justify-between">
            <PanelTitle title="Segments" subtitle={`${segments.length} blocks`} />
            <button className="btn-secondary px-3" onClick={autoPlaceSelected}>
              Auto-place
            </button>
          </div>

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
          </aside>
        )}

        <main className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_top,#263450_0%,#101522_45%,#070b16_100%)]">
          <Toolbar
            tool={tool}
            setTool={setTool}
            zoom={zoom}
            setZoom={setZoom}
            gridEnabled={gridEnabled}
            setGridEnabled={setGridEnabled}
            lockToRegions={lockToRegions}
            setLockToRegions={setLockToRegions}
            loadPendingImage={(file) => {
              if (!file) return;
              setPendingImage(URL.createObjectURL(file));
              setTool("insertImage");
            }}
          />

          <div className="flex gap-2 border-b border-slate-800 bg-[#0b1020] p-2">
            {pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => {
                  setActivePageId(page.id);
                  setSelectedLayerId(null);
                  setSelectedSafeZoneId(null);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${activePageId === page.id
                    ? "bg-blue-600"
                    : "bg-slate-800 hover:bg-slate-700"
                  }`}
              >
                {page.title || `Page ${index + 1}`}
              </button>
            ))}

            <button className="btn-secondary px-3" onClick={addPage}>
              <Plus size={16} /> Page
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="min-h-full min-w-full p-10">
            <ReviewCanvas
              refEl={canvasRef}
              templateBackground={templateBackground}
              layers={activePage.layers}
              safeZones={safeZones}
              selectedLayerId={selectedLayerId}
              selectedSafeZoneId={selectedSafeZoneId}
              setSelectedLayerId={setSelectedLayerId}
              setSelectedSafeZoneId={setSelectedSafeZoneId}
              updateLayer={setLayer}
              updateSafeZone={setSafeZone}
              canvasClick={canvasClick}
              tool={tool}
              zoom={zoom}
              gridEnabled={gridEnabled}
              lockToRegions={lockToRegions}
            />
            </div>  
          </div>  
        </main>

        {rightPanelOpen && (
          <aside className="overflow-auto border-l border-slate-800 bg-[#111827] p-3">
          <PanelTitle title="Properties" subtitle="Move, resize and edit layers/safe zones." />

          <div className="panel mt-3 text-sm text-slate-400">
            Tool: <strong className="text-slate-100">{tool}</strong>
          </div>

          {selectedLayer ? (
            <LayerProperties
              selectedLayer={selectedLayer}
              setLayer={setLayer}
              removeLayer={removeLayer}
            />
          ) : selectedSafeZone ? (
            <SafeZoneProperties
              zone={selectedSafeZone}
              setSafeZone={setSafeZone}
              resetSafeZones={() => setSafeZones(DEFAULT_SAFE_ZONES)}
            />
          ) : (
            <div className="panel mt-3 text-sm text-slate-400">
              Select a layer or safe zone to edit it.
            </div>
          )}

          <div className="panel mt-3">
            <p className="mb-2 font-black">Layer list</p>
            <div className="space-y-2">
              {activePage.layers.map((layer, index) => (
                <button
                  key={layer.id}
                  onClick={() => {
                    setSelectedLayerId(layer.id);
                    setSelectedSafeZoneId(null);
                    setTool("select");
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selectedLayerId === layer.id
                      ? "bg-blue-600"
                      : "bg-slate-950 hover:bg-slate-800"
                    }`}
                >
                  {index + 1}. {layer.kind}
                  {layer.autoFlow && (
                    <span className="ml-2 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px]">
                      flow
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="panel mt-3">
            <p className="mb-2 font-black">Safe zones</p>
            <div className="space-y-2">
              {safeZones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => {
                    setSelectedSafeZoneId(zone.id);
                    setSelectedLayerId(null);
                    setTool("safeZone");
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selectedSafeZoneId === zone.id
                      ? "bg-emerald-600"
                      : "bg-slate-950 hover:bg-slate-800"
                    }`}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </div>
          </aside>)}
      </div>
    </div>
  );
}

function LayerProperties({ selectedLayer, setLayer, removeLayer }) {
  return (
    <div className="panel mt-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-black">Selected {selectedLayer.kind}</p>
        <button
          onClick={() => removeLayer(selectedLayer.id)}
          className="rounded-lg p-2 text-red-300 hover:bg-red-500/10"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={selectedLayer.x} onChange={(v) => setLayer(selectedLayer.id, { x: v })} />
        <NumberField label="Y" value={selectedLayer.y} onChange={(v) => setLayer(selectedLayer.id, { y: v })} />
        <NumberField label="Width" value={selectedLayer.w} onChange={(v) => setLayer(selectedLayer.id, { w: v })} />
        <NumberField label="Height" value={selectedLayer.h} onChange={(v) => setLayer(selectedLayer.id, { h: v })} />
      </div>

      {selectedLayer.kind === "text" && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <NumberField label="Font size" value={selectedLayer.fontSize} onChange={(v) => setLayer(selectedLayer.id, { fontSize: v })} />
            <NumberField label="Weight" value={selectedLayer.weight} onChange={(v) => setLayer(selectedLayer.id, { weight: v })} />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className={`tool-btn ${selectedLayer.weight >= 700 ? "tool-btn-active" : ""}`}
              onClick={() =>
                setLayer(selectedLayer.id, {
                  weight: selectedLayer.weight >= 700 ? 500 : 900,
                })
              }
            >
              Bold
            </button>

            <button
              className={`tool-btn ${selectedLayer.italic ? "tool-btn-active" : ""}`}
              onClick={() => setLayer(selectedLayer.id, { italic: !selectedLayer.italic })}
            >
              Italic
            </button>

            <button
              className={`tool-btn ${selectedLayer.autoFlow ? "tool-btn-active" : ""}`}
              onClick={() =>
                setLayer(selectedLayer.id, {
                  autoFlow: !selectedLayer.autoFlow,
                })
              }
            >
              Flow
            </button>
          </div>

          <TextArea label="Markdown Text" value={selectedLayer.text} onChange={(v) => setLayer(selectedLayer.id, { text: v })} />
        </>
      )}

      {selectedLayer.kind === "image" && (
        <Field label="Caption" value={selectedLayer.caption} onChange={(v) => setLayer(selectedLayer.id, { caption: v })} />
      )}
    </div>
  );
}

function SafeZoneProperties({ zone, setSafeZone, resetSafeZones }) {
  return (
    <div className="panel mt-3">
      <p className="mb-3 font-black">Safe zone: {zone.label}</p>

      <Field label="Label" value={zone.label} onChange={(v) => setSafeZone(zone.id, { label: v })} />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <NumberField label="X" value={zone.x} onChange={(v) => setSafeZone(zone.id, { x: v })} />
        <NumberField label="Y" value={zone.y} onChange={(v) => setSafeZone(zone.id, { y: v })} />
        <NumberField label="Width" value={zone.w} onChange={(v) => setSafeZone(zone.id, { w: v })} />
        <NumberField label="Height" value={zone.h} onChange={(v) => setSafeZone(zone.id, { h: v })} />
      </div>

      <button className="btn-secondary mt-3 w-full" onClick={resetSafeZones}>
        Reset safe zones
      </button>
    </div>
  );
}

function Toolbar({
  tool,
  setTool,
  zoom,
  setZoom,
  gridEnabled,
  setGridEnabled,
  lockToRegions,
  setLockToRegions,
  loadPendingImage,
}) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0b1020] px-3">
      <div className="flex items-center gap-2">
        <ToolButton active={tool === "select"} onClick={() => setTool("select")} icon={<MousePointer2 />}>
          Select
        </ToolButton>

        <ToolButton active={tool === "insertText"} onClick={() => setTool("insertText")} icon={<Type />}>
          Insert text
        </ToolButton>

        <label className={`tool-btn ${tool === "insertImage" ? "tool-btn-active" : ""}`}>
          <ImagePlus size={16} /> Insert image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => loadPendingImage(e.target.files?.[0])} />
        </label>

        <button className={`tool-btn ${gridEnabled ? "tool-btn-active" : ""}`} onClick={() => setGridEnabled(!gridEnabled)}>
          <LayoutGrid size={16} /> Grid
        </button>

        <button className={`tool-btn ${lockToRegions ? "tool-btn-active" : ""}`} onClick={() => setLockToRegions(!lockToRegions)}>
          Safe zones
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-secondary h-9 px-3" onClick={() => setZoom((z) => Math.max(0.45, Number((z - 0.1).toFixed(2))))}>
          <ZoomOut size={16} />
        </button>

        <span className="w-16 text-center text-sm">{Math.round(zoom * 100)}%</span>

        <button className="btn-secondary h-9 px-3" onClick={() => setZoom((z) => Math.min(2, Number((z + 0.1).toFixed(2))))}>
          <ZoomIn size={16} />
        </button>
      </div>
    </div>
  );
}

function ToolButton({ active, icon, children, onClick }) {
  return (
    <button onClick={onClick} className={`tool-btn ${active ? "tool-btn-active" : ""}`}>
      {React.cloneElement(icon, { size: 16 })}
      {children}
    </button>
  );
}

function ReviewCanvas({
  refEl,
  templateBackground,
  layers,
  safeZones,
  selectedLayerId,
  selectedSafeZoneId,
  setSelectedLayerId,
  setSelectedSafeZoneId,
  updateLayer,
  updateSafeZone,
  canvasClick,
  tool,
  zoom,
  gridEnabled,
  lockToRegions,
}) {
  const cursor = tool === "insertText" || tool === "insertImage" ? "cursor-crosshair" : "cursor-default";

  return (
    <motion.div className="mx-auto origin-top" style={{ width: 860 * zoom }}>
      <div
        ref={refEl}
        className={`editor-canvas relative aspect-[100/141.4286] w-full overflow-hidden rounded-2xl bg-[#efeae7] shadow-2xl ring-1 ring-white/10 ${cursor}`}
        onClick={canvasClick}
        style={{ containerType: "size" }}
      >
        <img
          src={templateBackground}
          alt="Hero template"
          onError={(e) => {
            e.currentTarget.src = fallbackTemplate;
          }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        {gridEnabled && (
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        )}

        {lockToRegions &&
          safeZones.map((zone) => (
            <SafeZone
              key={zone.id}
              zone={zone}
              selected={selectedSafeZoneId === zone.id}
              onSelect={(e) => {
                e.stopPropagation();
                setSelectedSafeZoneId(zone.id);
                setSelectedLayerId(null);
              }}
              onChange={(patch) => updateSafeZone(zone.id, patch)}
            />
          ))}

        {layers.map((layer) => (
          <PlacedLayer
            key={layer.id}
            layer={layer}
            selected={selectedLayerId === layer.id}
            onSelect={(e) => {
              e.stopPropagation();
              setSelectedLayerId(layer.id);
              setSelectedSafeZoneId(null);
            }}
            onMove={(patch) => updateLayer(layer.id, patch)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function SafeZone({ zone, selected, onSelect, onChange }) {
  const startRef = useRef(null);

  const style = {
    left: `${(zone.x / PAGE_W) * 100}%`,
    top: `${(zone.y / PAGE_H) * 100}%`,
    width: `${(zone.w / PAGE_W) * 100}%`,
    height: `${(zone.h / PAGE_H) * 100}%`,
  };

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    startRef.current = {
      mode: "drag",
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: zone.x,
      y: zone.y,
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    startRef.current = {
      mode: "resize",
      pointerX: e.clientX,
      pointerY: e.clientY,
      w: zone.w,
      h: zone.h,
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function move(e) {
    const start = startRef.current;
    if (!start) return;

    const dx = ((e.clientX - start.pointerX) / 860) * PAGE_W;
    const dy = ((e.clientY - start.pointerY) / 1212) * PAGE_H;

    if (start.mode === "drag") {
      onChange({
        x: Math.round(start.x + dx),
        y: Math.round(start.y + dy),
      });
    }

    if (start.mode === "resize") {
      onChange({
        w: Math.max(40, Math.round(start.w + dx)),
        h: Math.max(30, Math.round(start.h + dy)),
      });
    }
  }

  function stop() {
    startRef.current = null;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  }

  return (
    <div
      onPointerDown={startDrag}
      className={`absolute cursor-move border bg-emerald-400/5 ${selected
          ? "border-emerald-300 ring-2 ring-emerald-300"
          : "border-emerald-400/40"
        }`}
      style={style}
    >
      <div className="absolute left-1 top-1 rounded bg-emerald-500/80 px-2 py-0.5 text-[10px] font-bold text-white">
        {zone.label}
      </div>

      {selected && (
        <button
          onPointerDown={startResize}
          className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-emerald-400 ring-2 ring-white"
          title="Resize safe zone"
        />
      )}
    </div>
  );
}

function PlacedLayer({ layer, selected, onSelect, onMove }) {
  const startRef = useRef(null);

  const style = {
    left: `${(layer.x / PAGE_W) * 100}%`,
    top: `${(layer.y / PAGE_H) * 100}%`,
    width: `${(layer.w / PAGE_W) * 100}%`,
    minHeight: `${(layer.h / PAGE_H) * 100}%`,
  };

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    startRef.current = {
      mode: "drag",
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: layer.x,
      y: layer.y,
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(e);

    startRef.current = {
      mode: "resize",
      pointerX: e.clientX,
      pointerY: e.clientY,
      w: layer.w,
      h: layer.h,
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function move(e) {
    const start = startRef.current;
    if (!start) return;

    const dx = ((e.clientX - start.pointerX) / 860) * PAGE_W;
    const dy = ((e.clientY - start.pointerY) / 1212) * PAGE_H;

    if (start.mode === "drag") {
      onMove({
        x: Math.round(start.x + dx),
        y: Math.round(start.y + dy),
      });
    }

    if (start.mode === "resize") {
      onMove({
        w: Math.max(60, Math.round(start.w + dx)),
        h: Math.max(40, Math.round(start.h + dy)),
      });
    }
  }

  function stop() {
    startRef.current = null;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  }

  return (
    <div
      onPointerDown={startDrag}
      onClick={onSelect}
      className={`absolute cursor-move rounded-sm text-left ${selected
          ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-blue-950"
          : "hover:ring-2 hover:ring-white/50"
        }`}
      style={style}
    >
      {layer.kind === "text" ? (
        <div
          className="vod-text whitespace-pre-wrap text-[#5f4e46] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
          style={{
            fontSize: `${layer.fontSize / 10}cqw`,
            fontWeight: layer.weight,
            fontStyle: layer.italic ? "italic" : "normal",
            lineHeight: 1.25,
          }}
        >
          {layer.markdown ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {layer.text}
            </ReactMarkdown>
          ) : (
            layer.text
          )}
        </div>
      ) : (
        <div className="overflow-hidden bg-slate-800 shadow-lg">
          <img src={layer.src} alt="Screenshot" className="aspect-video w-full object-cover" />
          <div className="bg-[#25274f] px-3 py-2 text-center text-[1.1cqw] font-black uppercase leading-tight text-white">
            {layer.caption}
          </div>
        </div>
      )}

      {selected && (
        <button
          onPointerDown={startResize}
          className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-blue-500 ring-2 ring-white"
          title="Resize"
        />
      )}
    </div>
  );
}

function PanelTitle({ icon, title, subtitle }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon && React.cloneElement(icon, { className: "h-4 w-4 text-blue-300" })}
        <h2 className="font-black">{title}</h2>
      </div>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

function Label({ children }) {
  return (
    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
      {children}
    </span>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input className="input" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="mt-3 block">
      <Label>{label}</Label>
      <textarea className="input min-h-32 resize-y" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}