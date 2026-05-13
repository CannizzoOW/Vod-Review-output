import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Save, RefreshCcw, Download, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Redo2, Undo2 } from "lucide-react";
import { exportAllPages } from "./utils/exportAllPages.js";

// Hooks
import { useReviewForm } from "./hooks/useReviewForm.js";
import { usePages } from "./hooks/usePages.js";
import { useSegments } from "./hooks/useSegments.js";
import { useSelection } from "./hooks/useSelection.js";
import { useLayers } from "./hooks/useLayers.js";
import { useUIState } from "./hooks/useUIState.js";

// Components
import { Toolbar } from "./components/Toolbar/Toolbar.jsx";
import { LeftPanel } from "./components/Panels/LeftPanel.jsx";
import { RightPanel } from "./components/Panels/RightPanel.jsx";
import { ReviewCanvas } from "./components/Canvas/ReviewCanvas.jsx";
import { NewReviewWizard } from "./components/Modals/NewReviewWizard.jsx";
import { EditReviewDetailsModal } from "./components/Modals/EditReviewDetailsModal.jsx";
import { TextEditorModal } from "./components/Modals/TextEditorModal.jsx";

// Utils & Constants
import { HEROES, FALLBACK_TEMPLATE, DEFAULT_SAFE_ZONES, SAMPLE_REVIEW, heroTemplates } from "./utils/constants.js";
import { parseDiscordReview } from "./utils/parsing.js";
import { buildReviewPages } from "./utils/buildReviewPages.js";
import { makeEmojiLayer, makeImageLayer, makeShapeLayer, syncPageTitleLayers } from "./utils/layerFactory.js";
import { autoPlaceInZone } from "./utils/canvas.js";

const PAGE_W = 1080;
const PAGE_H = 1527;

export default function App() {
  const canvasRef = React.useRef(null);
  const exportRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const historyRef = React.useRef({ past: [], future: [], last: null });
  const skipHistoryRef = React.useRef(false);
  const [textEditorLayerId, setTextEditorLayerId] = React.useState(null);

  // State management
  const { form, setForm, updateForm } = useReviewForm(HEROES[0]);
  const { pages, setPages, activePageId, setActivePageId, activePage, editingPageId, setEditingPageId, updateActivePageLayers, updatePageTitleLayer, updateFooterLayer, renamePage, getPageFallbackTitle, getNextPageTitle, removeActivePage, addPage } = usePages(form);
  const { rawText, setRawText, segments, setSegments, selectedSegmentId, setSelectedSegmentId, selectedSegment, runParser, markSegmentUsed, syncSegmentUsage, autoPlaceAllSegments } = useSegments(pages, activePageId, setPages);
  const { selectedLayerId, setSelectedLayerId, selectedLayerIds, setSelectedLayerIds, selectedSafeZoneId, setSelectedSafeZoneId, selectedLayer, tool, setTool, deselectAll, selectLayer, selectSafeZone, deleteSelectedLayers } = useSelection(pages, activePageId, setPages);
  const uiState = useUIState();

  const {
    safeZones,
    setSafeZones,
    selectedSafeZone,
    setLayer,
    setSafeZone,
    addLayer,
    removeLayer,
  } = useLayers(
    pages,
    activePageId,
    setPages,
    uiState.gridEnabled,
    uiState.lockToRegions
  );

  const templateBackground = React.useMemo(() => {
    const template = heroTemplates[form.hero]?.template;
    if (!template) return FALLBACK_TEMPLATE;
    return `${import.meta.env.BASE_URL}${template.replace(/^\/+/, "")}`;
  }, [form.hero]);

  const selectedLayers = React.useMemo(
    () =>
      (activePage?.layers || []).filter((layer) =>
        selectedLayerIds.includes(layer.id)
      ),
    [activePage?.layers, selectedLayerIds]
  );
  const textEditorLayer = React.useMemo(
    () =>
      (activePage?.layers || []).find(
        (layer) => layer.id === textEditorLayerId && layer.kind === "text"
      ),
    [activePage?.layers, textEditorLayerId]
  );
  const textEditorPreviewBackgroundLayer = React.useMemo(() => {
    if (textEditorLayer?.id !== "page-title") return null;

    return (activePage?.layers || []).find(
      (layer) => layer.id === "default-background-rect"
    ) || null;
  }, [activePage?.layers, textEditorLayer?.id]);
  const activePageIndex = pages.findIndex((page) => page.id === activePageId);
  const canGoPrevPage = activePageIndex > 0;
  const canGoNextPage = activePageIndex >= 0 && activePageIndex < pages.length - 1;

  function goToPageOffset(offset) {
    const nextPage = pages[activePageIndex + offset];
    if (!nextPage) return;

    setActivePageId(nextPage.id);
    deselectAll();
  }

  function cloneSnapshot(snapshot) {
    return JSON.parse(JSON.stringify(snapshot));
  }

  function restoreSnapshot(snapshot) {
    skipHistoryRef.current = true;
    setPages(snapshot.pages);
    setActivePageId(snapshot.activePageId);
    deselectAll();
  }

  function undo() {
    const history = historyRef.current;
    const previous = history.past.pop();

    if (!previous) return;

    if (history.last) {
      history.future.unshift(cloneSnapshot(history.last));
    }

    history.last = cloneSnapshot(previous);
    restoreSnapshot(previous);
  }

  function redo() {
    const history = historyRef.current;
    const next = history.future.shift();

    if (!next) return;

    if (history.last) {
      history.past.push(cloneSnapshot(history.last));
    }

    history.last = cloneSnapshot(next);
    restoreSnapshot(next);
  }

  function duplicateSelectedLayers() {
    const idsToDuplicate = selectedLayerIds.length
      ? selectedLayerIds
      : selectedLayerId
        ? [selectedLayerId]
        : [];

    if (!idsToDuplicate.length) return;

    const duplicates = (activePage?.layers || [])
      .filter((layer) => idsToDuplicate.includes(layer.id))
      .map((layer) => {
        const duplicate = {
          ...layer,
          id: crypto.randomUUID(),
          x: layer.x + 20,
          y: layer.y + 20,
          locked: false,
        };

        delete duplicate.sourceSegmentId;
        return duplicate;
      });

    if (!duplicates.length) return;

    const nextSelectedIds = duplicates.map((layer) => layer.id);

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== activePageId) return page;
        return {
          ...page,
          layers: [...page.layers, ...duplicates],
        };
      })
    );

    setSelectedLayerIds(nextSelectedIds);
    setSelectedLayerId(nextSelectedIds[nextSelectedIds.length - 1] || null);
  }

  function reorderSelectedLayers(mode) {
    const ids = new Set(selectedLayerIds.length ? selectedLayerIds : selectedLayerId ? [selectedLayerId] : []);
    if (!ids.size) return;

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== activePageId) return page;

        const layers = [...page.layers];

        if (mode === "front") {
          return {
            ...page,
            layers: [
              ...layers.filter((layer) => !ids.has(layer.id)),
              ...layers.filter((layer) => ids.has(layer.id)),
            ],
          };
        }

        if (mode === "back") {
          return {
            ...page,
            layers: [
              ...layers.filter((layer) => ids.has(layer.id)),
              ...layers.filter((layer) => !ids.has(layer.id)),
            ],
          };
        }

        if (mode === "forward") {
          for (let index = layers.length - 2; index >= 0; index--) {
            if (!ids.has(layers[index].id) || ids.has(layers[index + 1].id)) continue;
            [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
          }
        }

        if (mode === "backward") {
          for (let index = 1; index < layers.length; index++) {
            if (!ids.has(layers[index].id) || ids.has(layers[index - 1].id)) continue;
            [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
          }
        }

        return { ...page, layers };
      })
    );
  }

  // Canvas event handlers
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

    if (tool === "insertImage" && uiState.pendingImage) {
      addLayer(makeImageLayer(uiState.pendingImage, Math.round(x), Math.round(y)));
      setTool("select");
    }

    if (tool.startsWith("insertShape:")) {
      const shapeType = tool.replace("insertShape:", "");
      addLayer(makeShapeLayer(shapeType, Math.round(x), Math.round(y)));
      setTool("select");
    }
  }

  // Import/Export handlers
  function importJson(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const request = data.request || data.meta?.request || data.meta || {};
        const coach = data.coach || {};

        const importedForm = {
          player: request.player || request.username || form.player,
          hero: request.hero || request.heroes || form.hero,
          reviewer: coach.displayName || coach.username || request.reviewer || form.reviewer,
          replayId: request.replayId || request.replayID || request.replay_id || form.replayId,
          requestId: request.requestId || request.id || form.requestId,
        };

        let importedSegments = [];

        if (Array.isArray(data.segments)) {
          importedSegments = data.segments.map((s) => ({
            id: s.id || crypto.randomUUID(),
            type: s.type || "paragraph",
            title: s.title || s.section || "General",
            section: s.section || s.title || "General",
            timestamp: s.timestamp || "",
            text: s.text || "",
            used: true,
          }));
        }

        setForm((prev) => ({ ...prev, ...importedForm }));
        setSegments(importedSegments);

        if (Array.isArray(data.pages) && data.pages.length) {
          const importedPages = data.pages.map((p) => ({
            id: p.id || crypto.randomUUID(),
            title: p.title || "Page",
            isCoverPage: Boolean(p.isCoverPage),
            layers: Array.isArray(p.layers) ? p.layers : [],
          }));

          setPages(importedPages);
          setActivePageId(importedPages[0]?.id);
        } else {
          const generatedPages = buildReviewPages({
            form: importedForm,
            segments: importedSegments,
            safeZones: Array.isArray(data.safeZones) ? data.safeZones : DEFAULT_SAFE_ZONES,
          });

          setPages(generatedPages);
          setActivePageId(generatedPages[0]?.id);
        }

        if (Array.isArray(data.safeZones)) {
          setSafeZones(data.safeZones);
        }

        deselectAll();
        setTool("select");

        alert("Review JSON imported and layout generated.");
      } catch (error) {
        console.error("Could not import JSON:", error);
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

  async function exportPng() {
    await exportAllPages({
      pages,
      activePageId,
      setActivePageId,
      exportRef,
      form,
      uiState,
      deselectAll,
      PAGE_W,
      PAGE_H,
    });
  }

  function finishWizardReview() {
    const cleanForm = {
      player: uiState.wizardForm.player.trim(),
      reviewer: uiState.wizardForm.reviewer.trim(),
      replayId: uiState.wizardForm.replayId.trim(),
      hero: uiState.wizardForm.hero || HEROES[0],
      requestId: "",
    };

    let nextSegments = [];
    const nextRawText = uiState.wizardSource === "paste"
      ? uiState.wizardRawText
      : "";

    if (uiState.wizardSource === "paste") {
      const parsed = parseDiscordReview(nextRawText);

      nextSegments = parsed.segments.map((segment) => ({
        ...segment,
        used: true,
      }));

      if (!cleanForm.replayId && parsed.replayId) {
        cleanForm.replayId = parsed.replayId;
      }
    }

    const generatedPages = buildReviewPages({
      form: cleanForm,
      segments: nextSegments,
      safeZones: DEFAULT_SAFE_ZONES,
    });

    setForm((prev) => ({ ...prev, ...cleanForm }));
    setPages(generatedPages);
    setActivePageId(generatedPages[0]?.id);
    setSegments(nextSegments);
    setRawText(nextRawText);
    deselectAll();
    setSafeZones(DEFAULT_SAFE_ZONES);
    setTool("select");
    uiState.setWizardOpen(false);

    if (uiState.wizardSource === "json") {
      fileInputRef.current?.click();
    }
  }

  // Effects
  useEffect(() => {
    const snapshot = cloneSnapshot({ pages, activePageId });
    const history = historyRef.current;

    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      history.last = snapshot;
      return;
    }

    if (!history.last) {
      history.last = snapshot;
      return;
    }

    history.past.push(history.last);
    history.past = history.past.slice(-60);
    history.future = [];
    history.last = snapshot;
  }, [pages, activePageId]);

  useEffect(() => {
    updateActivePageLayers((layers) => {
      const hasFooter = layers.some((layer) => layer.id === "footer-info");

      if (!hasFooter) return layers;

      return layers.map((layer) =>
        layer.id === "footer-info"
          ? {
            ...layer,
            text: `VOD REVIEW  | @${form.player || "USERNAME"} | FOR QUESTIONS, PING @${form.reviewer || "COACH"} | REPLAY ID: ${form.replayId || ""}`,
          }
          : layer
      );
    });
  }, [form.player, form.reviewer, form.replayId]);

  useEffect(() => {
    updateActivePageLayers((layers) => {
      const hasTitle = layers.some((layer) => layer.id === "page-title");

      if (!hasTitle) return layers;

      return syncPageTitleLayers(layers, activePage?.title || "VOD FEEDBACK");
    });
  }, [activePage?.title, activePageId]);

  useEffect(() => {
    function handleKeyDown(e) {
      const target = e.target;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isTyping) return;

      if (e.key === "Escape") {
        e.preventDefault();
        deselectAll();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelectedLayers();
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedLayers(() => syncSegmentUsage(pages));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLayerId, selectedLayerIds, activePageId, pages]);

  return (
    <div className="h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0f172a] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/40 bg-blue-600/20 text-lg font-black text-blue-200 shadow-lg">
            R
          </div>

          <div>
            <h1 className="text-lg font-black leading-tight">
              Rivals VOD Review Editor
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              uiState.setWizardStep(1);
              uiState.setWizardSource("json");
              uiState.setWizardRawText("");
              uiState.setWizardForm({
                player: "",
                reviewer: "",
                replayId: "",
                hero: HEROES[0],
              });
              uiState.setWizardOpen(true);
            }}
          >
            <Plus size={16} /> New Review
          </button>

          <button
            className="btn-secondary"
            onClick={() => uiState.setDetailsEditorOpen(true)}
          >
            Edit Details
          </button>

          <button
            className={`btn-secondary ${uiState.pageTabsOpen ? "ring-1 ring-blue-400" : ""}`}
            onClick={() => uiState.setPageTabsOpen(!uiState.pageTabsOpen)}
          >
            {uiState.pageTabsOpen ? "Hide Pages" : "Show Pages"}
          </button>

          <button className="btn-secondary px-3" onClick={undo} title="Undo (Ctrl+Z)">
            <Undo2 size={16} /> Undo
          </button>

          <button className="btn-secondary px-3" onClick={redo} title="Redo (Ctrl+Y)">
            <Redo2 size={16} /> Redo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              importJson(e.target.files?.[0]);
              e.target.value = "";
            }}
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
        className="grid h-[calc(100vh-56px)] min-h-0 overflow-hidden transition-all duration-200"
        style={{
          gridTemplateColumns: `${uiState.leftPanelOpen ? "330px" : "0px"} minmax(0, 1fr) ${uiState.rightPanelOpen ? "320px" : "0px"}`,
        }}
      >
        <aside className="relative min-h-0 overflow-visible border-r border-slate-800 bg-[#111827]">
          <button
            className="absolute -right-4 top-[120px] z-50 flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg hover:bg-blue-600"
            onClick={() => uiState.setLeftPanelOpen(!uiState.leftPanelOpen)}
            title={uiState.leftPanelOpen ? "Hide left panel" : "Show left panel"}
          >
            {uiState.leftPanelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          {uiState.leftPanelOpen && (
            <LeftPanel
              segments={segments}
              selectedSegmentId={selectedSegmentId}
              setSelectedSegmentId={setSelectedSegmentId}
              setTool={setTool}
              autoPlaceAllSegments={() => autoPlaceAllSegments(safeZones)}
              onAddEmoji={(emoji) => {
                addLayer(makeEmojiLayer(emoji));
                setTool("select");
              }}
              segmentsOpen={uiState.segmentsOpen}
              setSegmentsOpen={uiState.setSegmentsOpen}
            />
          )}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#263450_0%,#101522_45%,#070b16_100%)]">
          <Toolbar
            tool={tool}
            setTool={setTool}
            selectedLayer={selectedLayer}
            selectedLayers={selectedLayers}
            setLayer={setLayer}
            zoom={uiState.zoom}
            setZoom={uiState.setZoom}
            gridEnabled={uiState.gridEnabled}
            setGridEnabled={uiState.setGridEnabled}
            lockToRegions={uiState.lockToRegions}
            setLockToRegions={uiState.setLockToRegions}
            updateFooterLayer={updateFooterLayer}
            loadPendingImage={(file) => {
              if (!file) return;
              uiState.setPendingImage(URL.createObjectURL(file));
              setTool("insertImage");
            }}
          />

          {uiState.pageTabsOpen && (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-[#0b1020] p-2">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`flex items-center overflow-hidden rounded-xl ${activePageId === page.id
                      ? "bg-blue-600"
                      : "bg-slate-800 hover:bg-slate-700"
                    }`}
                >
                  {editingPageId === page.id ? (
                    <input
                      className="min-w-28 bg-transparent px-3 py-2 text-sm font-bold text-white outline-none"
                      autoFocus
                      value={page.title || ""}
                      placeholder={`Page ${index + 1}`}
                      onChange={(e) => {
                        const nextTitle = e.target.value || `Page ${index + 1}`;
                        renamePage(page.id, nextTitle);
                      }}
                      onBlur={() => {
                        const fallbackTitle = getPageFallbackTitle(index, page.id);
                        const finalTitle = (page.title || "").trim() || fallbackTitle;
                        renamePage(page.id, finalTitle);
                        setEditingPageId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }

                        if (e.key === "Escape") {
                          setEditingPageId(null);
                        }
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setActivePageId(page.id);
                        deselectAll();
                      }}
                      onDoubleClick={() => {
                        setActivePageId(page.id);
                        setEditingPageId(page.id);
                      }}
                      className="px-3 py-2 text-sm font-bold"
                      title="Double-click to rename page"
                    >
                      {page.title || `Page ${index + 1}`}
                    </button>
                  )}

                  {pages.length > 1 && activePageId === page.id && (
                    <button
                      onClick={removeActivePage}
                      className="px-2 py-2 text-red-200 hover:bg-red-500/20"
                      title="Delete page"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button className="btn-secondary px-3" onClick={addPage}>
                <Plus size={16} /> Page
              </button>
            </div>
          )}

          <div className="group/canvasnav relative flex-1 min-h-0 min-w-0 overflow-scroll">
            {canGoPrevPage && (
              <button
                className="absolute left-5 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-700 bg-slate-950/85 text-slate-100 opacity-0 shadow-2xl backdrop-blur transition hover:bg-blue-600 group-hover/canvasnav:opacity-100"
                onClick={() => goToPageOffset(-1)}
                title="Previous page"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {canGoNextPage && (
              <button
                className="absolute right-5 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-700 bg-slate-950/85 text-slate-100 opacity-0 shadow-2xl backdrop-blur transition hover:bg-blue-600 group-hover/canvasnav:opacity-100"
                onClick={() => goToPageOffset(1)}
                title="Next page"
              >
                <ChevronRight size={28} />
              </button>
            )}

            <div
              className="flex justify-center"
              style={{
                width: "max-content",
                minWidth: "100%",
                padding: "80px 80px 220px 80px",
              }}
            >
              <div
                style={{
                  width: `${860 * uiState.zoom}px`,
                }}
              >
                <ReviewCanvas
                  canvasRef={canvasRef}
                  exportRef={exportRef}
                  deselectAll={deselectAll}
                  selectSafeZone={selectSafeZone}
                  isExporting={uiState.isExporting}
                  templateBackground={templateBackground}
                  layers={activePage?.layers || []}
                  safeZones={safeZones}
                  selectedLayerId={selectedLayerId}
                  selectedLayerIds={selectedLayerIds}
                  selectedSafeZoneId={selectedSafeZoneId}
                  selectLayer={selectLayer}
                  editTextLayer={setTextEditorLayerId}
                  updateLayer={setLayer}
                  updateSafeZone={setSafeZone}
                  canvasClick={canvasClick}
                  tool={tool}
                  zoom={uiState.zoom}
                  gridEnabled={uiState.gridEnabled}
                  lockToRegions={uiState.lockToRegions}
                  timestampGutterWidth={uiState.timestampGutterWidth}
                  timestampFontSize={uiState.timestampFontSize}
                  timestampColor={uiState.timestampColor}
                />
              </div>
            </div>
          </div>
        </main>

        <aside className="relative min-h-0 overflow-visible border-l border-slate-800 bg-[#111827]">
          <button
            className="absolute -left-4 top-[120px] z-50 flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg hover:bg-blue-600"
            onClick={() => uiState.setRightPanelOpen(!uiState.rightPanelOpen)}
            title={uiState.rightPanelOpen ? "Hide right panel" : "Show right panel"}
          >
            {uiState.rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          {uiState.rightPanelOpen && (
            <RightPanel
              selectedLayer={selectedLayer}
              setLayer={setLayer}
              removeLayer={(id) => removeLayer(id, () => syncSegmentUsage(pages))}
              selectedSafeZone={selectedSafeZone}
              setSafeZone={setSafeZone}
              activePage={activePage || { layers: [] }}
              selectedLayerIds={selectedLayerIds}
              selectLayer={selectLayer}
              setTool={setTool}
              safeZones={safeZones}
              lockToRegions={uiState.lockToRegions}
              selectedSafeZoneId={selectedSafeZoneId}
              setSelectedSafeZoneId={setSelectedSafeZoneId}
              setSelectedLayerId={setSelectedLayerId}
              setSelectedLayerIds={setSelectedLayerIds}
              duplicateSelectedLayers={duplicateSelectedLayers}
              reorderSelectedLayers={reorderSelectedLayers}
              timestampGutterWidth={uiState.timestampGutterWidth}
              setTimestampGutterWidth={uiState.setTimestampGutterWidth}
              timestampFontSize={uiState.timestampFontSize}
              setTimestampFontSize={uiState.setTimestampFontSize}
              timestampColor={uiState.timestampColor}
              setTimestampColor={uiState.setTimestampColor}
              layerListOpen={uiState.layerListOpen}
              setLayerListOpen={uiState.setLayerListOpen}
              safeZonesOpen={uiState.safeZonesOpen}
              setSafeZonesOpen={uiState.setSafeZonesOpen}
            />
          )}
        </aside>
      </div>

      {uiState.wizardOpen && (
        <NewReviewWizard
          step={uiState.wizardStep}
          setStep={uiState.setWizardStep}
          wizardSource={uiState.wizardSource}
          setWizardSource={uiState.setWizardSource}
          wizardRawText={uiState.wizardRawText}
          setWizardRawText={uiState.setWizardRawText}
          wizardForm={uiState.wizardForm}
          setWizardForm={uiState.setWizardForm}
          heroes={HEROES}
          onClose={() => uiState.setWizardOpen(false)}
          onFinish={finishWizardReview}
        />
      )}

      {uiState.detailsEditorOpen && (
        <EditReviewDetailsModal
          form={form}
          setForm={setForm}
          rawText={rawText}
          setRawText={setRawText}
          heroes={HEROES}
          onRegenerateFromText={(nextForm, nextRawText) => {
            const parsed = parseDiscordReview(nextRawText);

            const nextSegments = parsed.segments.map((segment) => ({
              ...segment,
              used: true,
            }));

            const formWithReplay = {
              ...nextForm,
              replayId: nextForm.replayId || parsed.replayId,
            };

            const generatedPages = buildReviewPages({
              form: formWithReplay,
              segments: nextSegments,
              safeZones: DEFAULT_SAFE_ZONES,
            });

            setForm(formWithReplay);
            setRawText(nextRawText);
            setSegments(nextSegments);
            setPages(generatedPages);
            setActivePageId(generatedPages[0]?.id);
            deselectAll();
            setSafeZones(DEFAULT_SAFE_ZONES);
            setTool("select");
          }}
          onClose={() => uiState.setDetailsEditorOpen(false)}
        />
      )}

      {textEditorLayer && (
        <TextEditorModal
          key={textEditorLayer.id}
          layer={textEditorLayer}
          previewBackgroundLayer={textEditorPreviewBackgroundLayer}
          onClose={() => setTextEditorLayerId(null)}
          onSave={(layerId, patch) => {
            if (layerId === "page-title") {
              renamePage(activePageId, patch.text || "VOD FEEDBACK");
              setLayer(layerId, patch);
              return;
            }

            setLayer(layerId, patch);
          }}
        />
      )}
    </div>
  );
}
