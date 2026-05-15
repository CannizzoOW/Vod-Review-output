import { useState } from "react";
import { ArrowDown, ArrowUp, Box, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp, Copy, Eye, EyeOff, Folder, Layers, Lock, LockOpen, Smile, Trash2, Type } from "lucide-react";
import { PanelTitle } from "./PanelTitle.jsx";
import { Field } from "../FormFields/Field.jsx";
import { NumberField } from "../FormFields/NumberField.jsx";
import { ShapeControls } from "./ShapeControls.jsx";
import { DEFAULT_SAFE_ZONES } from "../../utils/constants.js";
import { getLayerListLabel } from "../../utils/textUtils.js";

export function RightPanel({
  selectedLayer,
  setLayer,
  removeLayer,
  selectedSafeZone,
  setSafeZone,
  activePage,
  selectedLayerIds,
  selectLayer,
  setTool,
  safeZones,
  lockToRegions,
  selectedSafeZoneId,
  setSelectedSafeZoneId,
  setSelectedLayerId,
  setSelectedLayerIds,
  duplicateSelectedLayers,
  reorderSelectedLayers,
  deleteSelectedLayers,
  setAllLayerVisibility,
  setAllLayerLocks,
  groupSelectedLayers,
  fullWidthText,
  setFullWidthText,
  fullWidthTextBlocked,
  timestampGutterWidth,
  setTimestampGutterWidth,
  timestampFontSize,
  setTimestampFontSize,
  timestampColor,
  setTimestampColor,
  layerListOpen,
  setLayerListOpen,
  safeZonesOpen,
  setSafeZonesOpen,
}) {
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [editingName, setEditingName] = useState(null);
  const layerEntries = buildLayerEntries(activePage.layers || []);

  function getLayerGroupKey(layer) {
    if (!layer.groupId) return "";

    return layer.groupName === "Text segments"
      ? `name:${layer.groupName}`
      : `id:${layer.groupId}`;
  }

  function getParentGroupKey(layer) {
    return layer.parentGroupId ? `id:${layer.parentGroupId}` : "";
  }

  function buildLayerEntries(layers) {
    const topFirstLayers = [...layers].reverse();
    const groupMap = new Map();
    const rootEntries = [];

    function ensureGroup(key, name, order) {
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          type: "group",
          id: key,
          groupId: key.startsWith("id:") ? key.slice(3) : "",
          name: name || "Group",
          directLayers: [],
          layers: [],
          children: [],
          parentKey: "",
          order,
        });
      }

      const group = groupMap.get(key);
      group.order = Math.min(group.order, order);
      return group;
    }

    topFirstLayers.forEach((layer, index) => {
      const groupKey = getLayerGroupKey(layer);

      if (!groupKey) {
        rootEntries.push({ type: "layer", layer, order: index });
        return;
      }

      const group = ensureGroup(groupKey, layer.groupName, index);
      const parentKey = getParentGroupKey(layer);

      group.directLayers.push(layer);
      group.layers.push(layer);

      if (parentKey) {
        group.parentKey = parentKey;
        ensureGroup(parentKey, layer.parentGroupName, index);
      }
    });

    for (const group of groupMap.values()) {
      if (group.parentKey && groupMap.has(group.parentKey)) {
        const parent = groupMap.get(group.parentKey);
        parent.children.push(group);
      }
    }

    const nestedGroupIds = new Set(
      [...groupMap.values()]
        .filter((group) => group.parentKey && groupMap.has(group.parentKey))
        .map((group) => group.id)
    );
    const rootGroups = [...groupMap.values()].filter(
      (group) => !nestedGroupIds.has(group.id)
    );

    function collectGroupLayers(group) {
      group.layers = [
        ...group.directLayers,
        ...group.children.flatMap((child) => collectGroupLayers(child)),
      ];

      return group.layers;
    }

    rootGroups.forEach(collectGroupLayers);

    return [...rootEntries, ...rootGroups].sort((a, b) => a.order - b.order);
  }

  function setGroupPatch(layers, patch) {
    for (const layer of layers) {
      setLayer(layer.id, patch);
    }
  }

  function selectGroup(layers) {
    const layerIds = layers.map((layer) => layer.id);

    setSelectedSafeZoneId(null);
    setSelectedLayerIds(layerIds);
    setSelectedLayerId(layerIds[0] || null);
    setTool("select");
  }

  function toggleGroupCollapsed(groupId) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }

  function getNestedRowStyle(depth) {
    if (depth <= 0) return undefined;

    const indent = Math.min(depth, 4) * 1.25;

    return {
      marginLeft: `${indent}rem`,
      width: `calc(100% - ${indent}rem)`,
    };
  }

  function startLayerRename(e, layer) {
    e.preventDefault();
    e.stopPropagation();
    setEditingName({
      type: "layer",
      id: layer.id,
      value: getLayerListLabel(layer).replace(/^T\s|^IMG\s|^EMOJI\s|^S\s/, ""),
    });
  }

  function startGroupRename(e, entry) {
    e.preventDefault();
    e.stopPropagation();
    setEditingName({
      type: "group",
      id: entry.id,
      value: entry.name,
    });
  }

  function cancelRename() {
    setEditingName(null);
  }

  function commitLayerRename(layer) {
    const name = editingName?.value?.trim();

    if (!name) {
      setEditingName(null);
      return;
    }

    setLayer(layer.id, { name });
    setEditingName(null);
  }

  function commitGroupRename(entry) {
    const name = editingName?.value?.trim();

    if (!name) {
      setEditingName(null);
      return;
    }

    for (const layer of entry.layers) {
      const patch = {};

      if (entry.groupId && layer.groupId === entry.groupId) {
        patch.groupName = name;
      }

      if (entry.groupId && layer.parentGroupId === entry.groupId) {
        patch.parentGroupName = name;
      }

      if (!entry.groupId && entry.directLayers.some((directLayer) => directLayer.id === layer.id)) {
        patch.groupName = name;
      }

      if (Object.keys(patch).length) {
        setLayer(layer.id, patch);
      }
    }

    setEditingName(null);
  }

  function renderRenameInput(value, onChange, onCommit) {
    return (
      <input
        className="min-w-0 flex-1 rounded-md border border-blue-400 bg-slate-950 px-2 py-1 text-sm font-bold text-white outline-none"
        autoFocus
        value={value}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit();
          }

          if (e.key === "Escape") {
            e.preventDefault();
            cancelRename();
          }
        }}
      />
    );
  }

  function renderLayerRow(layer, depth = 0) {
    const indented = depth > 0;

    return (
      <button
        key={layer.id}
        onClick={(e) => {
          selectLayer(layer.id, e.shiftKey);
          setTool("select");
        }}
        className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm ${selectedLayerIds.includes(layer.id)
            ? "bg-blue-600"
            : "bg-slate-950 hover:bg-slate-800"
          } ${layer.visible === false ? "opacity-45" : ""} ${indented ? "border-l border-slate-700" : ""}`}
        style={getNestedRowStyle(depth)}
      >
        <span
          role="button"
          tabIndex={0}
          className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
          title={layer.visible === false ? "Show layer" : "Hide layer"}
          onClick={(e) => {
            e.stopPropagation();
            setLayer(layer.id, { visible: layer.visible === false });
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            setLayer(layer.id, { visible: layer.visible === false });
          }}
        >
          {layer.visible === false ? <EyeOff size={15} /> : <Eye size={15} />}
        </span>

        <span
          role="button"
          tabIndex={0}
          className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
          title={layer.locked ? "Unlock layer" : "Lock layer"}
          onClick={(e) => {
            e.stopPropagation();
            setLayer(layer.id, { locked: !layer.locked });
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            setLayer(layer.id, { locked: !layer.locked });
          }}
        >
          {layer.locked ? <Lock size={15} /> : <LockOpen size={15} />}
        </span>

        {layer.kind === "text" && (
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-slate-200">
            <Type size={13} />
          </span>
        )}

        {layer.kind === "image" && (
          <span className="mr-2 inline-flex h-5 items-center justify-center rounded bg-slate-700 px-1.5 text-[10px] font-black">
            IMG
          </span>
        )}

        {layer.kind === "emoji" && (
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-slate-200">
            <Smile size={13} />
          </span>
        )}

        {layer.kind === "shape" && (
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-slate-200">
            <Box size={13} />
          </span>
        )}

        {editingName?.type === "layer" && editingName.id === layer.id ? (
          renderRenameInput(
            editingName.value,
            (value) => setEditingName((prev) => ({ ...prev, value })),
            () => commitLayerRename(layer)
          )
        ) : (
          <span className="min-w-0 flex-1 truncate" onDoubleClick={(e) => startLayerRename(e, layer)}>
            {getLayerListLabel(layer).replace(/^T\s|^IMG\s|^EMOJI\s|^S\s/, "")}
          </span>
        )}

        {layer.autoFlow && (
          <span className="ml-2 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px]">
            flow
          </span>
        )}

        {layer.id === "footer-info" && (
          <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px]">
            footer
          </span>
        )}
      </button>
    );
  }

  function renderGroup(entry, depth = 0) {
    const groupVisible = entry.layers.some((layer) => layer.visible !== false);
    const groupLocked = entry.layers.every((layer) => layer.locked);
    const groupSelected = entry.layers.some((layer) =>
      selectedLayerIds.includes(layer.id)
    );
    const collapsed = Boolean(collapsedGroups[entry.id]);

    return (
      <div key={entry.id} className="space-y-1">
        <button
          onClick={() => selectGroup(entry.layers)}
          className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm ${
            groupSelected ? "bg-indigo-600" : "bg-slate-900 hover:bg-slate-800"
          } ${groupVisible ? "" : "opacity-45"} ${depth > 0 ? "border-l border-slate-700" : ""}`}
          style={getNestedRowStyle(depth)}
        >
          <span
            role="button"
            tabIndex={0}
            className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
            title={groupVisible ? "Hide group" : "Show group"}
            onClick={(e) => {
              e.stopPropagation();
              setGroupPatch(entry.layers, { visible: !groupVisible });
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
              setGroupPatch(entry.layers, { visible: !groupVisible });
            }}
          >
            {groupVisible ? <Eye size={15} /> : <EyeOff size={15} />}
          </span>

          <span
            role="button"
            tabIndex={0}
            className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
            title={groupLocked ? "Unlock group" : "Lock group"}
            onClick={(e) => {
              e.stopPropagation();
              setGroupPatch(entry.layers, { locked: !groupLocked });
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
              setGroupPatch(entry.layers, { locked: !groupLocked });
            }}
          >
            {groupLocked ? <Lock size={15} /> : <LockOpen size={15} />}
          </span>

          <span
            role="button"
            tabIndex={0}
            className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
            title={collapsed ? "Expand group" : "Collapse group"}
            onClick={(e) => {
              e.stopPropagation();
              toggleGroupCollapsed(entry.id);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
              toggleGroupCollapsed(entry.id);
            }}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
          </span>

          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-indigo-700 text-indigo-50">
            <Folder size={13} />
          </span>

          {editingName?.type === "group" && editingName.id === entry.id ? (
            renderRenameInput(
              editingName.value,
              (value) => setEditingName((prev) => ({ ...prev, value })),
              () => commitGroupRename(entry)
            )
          ) : (
            <span className="min-w-0 flex-1 truncate font-bold" onDoubleClick={(e) => startGroupRename(e, entry)}>
              {entry.name}
            </span>
          )}
          <span className="ml-2 rounded bg-indigo-900 px-1.5 py-0.5 text-[10px] text-indigo-100">
            {entry.layers.length}
          </span>
        </button>

        {!collapsed && (
          <>
            {entry.children
              .sort((a, b) => a.order - b.order)
              .map((child) => renderGroup(child, depth + 1))}
            {entry.directLayers.map((layer) => renderLayerRow(layer, depth + 1))}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden p-3">
      <PanelTitle title="Properties" subtitle="Move, resize and edit layers/safe zones." />

      {selectedLayer ? (
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

          {selectedLayer.locked ? (
            <div className="rounded-xl bg-slate-950 p-3 text-sm text-slate-400">
              Unlock this layer to move or resize it.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="X" value={selectedLayer.x} onChange={(v) => setLayer(selectedLayer.id, { x: v })} />
              <NumberField label="Y" value={selectedLayer.y} onChange={(v) => setLayer(selectedLayer.id, { y: v })} />
              <NumberField label="Width" value={selectedLayer.w} onChange={(v) => setLayer(selectedLayer.id, { w: v })} />
              <NumberField label="Height" value={selectedLayer.h} onChange={(v) => setLayer(selectedLayer.id, { h: v })} />
            </div>
          )}

          {selectedLayer.kind === "text" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField label="Font size" value={selectedLayer.fontSize} onChange={(v) => setLayer(selectedLayer.id, { fontSize: v })} />
              <NumberField label="Weight" value={selectedLayer.weight} onChange={(v) => setLayer(selectedLayer.id, { weight: v })} />
            </div>
          )}

          {selectedLayer.kind === "emoji" && (
            <>
              <div className="mt-3 rounded-xl bg-slate-950 p-3 text-sm text-slate-300">
                <p className="font-bold">{selectedLayer.name || "Rivals emoji"}</p>
                {selectedLayer.href && (
                  <a
                    href={selectedLayer.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-blue-200 hover:text-blue-100"
                  >
                    View source
                  </a>
                )}
              </div>

              <div className="mt-3">
                <NumberField
                  label="Rotation"
                  value={selectedLayer.rotation || 0}
                  onChange={(v) => setLayer(selectedLayer.id, { rotation: ((v % 360) + 360) % 360 })}
                />
              </div>
            </>
          )}

          {selectedLayer.kind === "shape" && (
            <ShapeControls
              layer={selectedLayer}
              onChange={(patch) => setLayer(selectedLayer.id, patch)}
            />
          )}
        </div>
      ) : selectedSafeZone ? (
        <div className="panel mt-3">
          <p className="mb-3 font-black">Safe zone: {selectedSafeZone.label}</p>

          <Field label="Label" value={selectedSafeZone.label} onChange={(v) => setSafeZone(selectedSafeZone.id, { label: v })} />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <NumberField label="X" value={selectedSafeZone.x} onChange={(v) => setSafeZone(selectedSafeZone.id, { x: v })} />
            <NumberField label="Y" value={selectedSafeZone.y} onChange={(v) => setSafeZone(selectedSafeZone.id, { y: v })} />
            <NumberField label="Width" value={selectedSafeZone.w} onChange={(v) => setSafeZone(selectedSafeZone.id, { w: v })} />
            <NumberField label="Height" value={selectedSafeZone.h} onChange={(v) => setSafeZone(selectedSafeZone.id, { h: v })} />
          </div>

          <button className="btn-secondary mt-3 w-full" onClick={() => safeZones.splice(0, safeZones.length, ...DEFAULT_SAFE_ZONES)}>
            Reset safe zones
          </button>
        </div>
      ) : null}

      <div className="panel mt-3" data-tutorial="full-text-width">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-black">Full text width</p>
            <p className="h-5 max-w-[190px] truncate text-sm text-slate-400">
              {fullWidthText && fullWidthTextBlocked
                ? "Blocked by screenshot zone"
                : fullWidthText
                  ? "Text can span the canvas"
                  : "Text respects screenshots"}
            </p>
          </div>

          <button
            className={`relative h-7 w-12 rounded-full border transition ${
              fullWidthText
                ? "border-blue-400 bg-blue-600"
                : "border-slate-700 bg-slate-950"
            }`}
            onClick={() => setFullWidthText(!fullWidthText)}
            title={fullWidthText ? "Disable full text width" : "Enable full text width"}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                fullWidthText ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="panel mt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-black">Timestamp gutter</p>
            <p className="h-5 max-w-[190px] truncate text-sm text-slate-400">
              {timestampGutterWidth > 0
                ? `On, ${timestampGutterWidth}px`
                : "Off, inline timestamps"}
            </p>
          </div>

          <button
            className={`relative h-7 w-12 rounded-full border transition ${
              timestampGutterWidth > 0
                ? "border-blue-400 bg-blue-600"
                : "border-slate-700 bg-slate-950"
            }`}
            onClick={() => setTimestampGutterWidth(timestampGutterWidth > 0 ? 0 : 84)}
            title={timestampGutterWidth > 0 ? "Disable timestamp gutter" : "Enable timestamp gutter"}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                timestampGutterWidth > 0 ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-3 h-6">
          <input
            className={`w-full accent-blue-500 transition-opacity ${
              timestampGutterWidth > 0 ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            type="range"
            min="40"
            max="150"
            step="2"
            value={timestampGutterWidth || 84}
            onChange={(e) => setTimestampGutterWidth(Number(e.target.value))}
            aria-hidden={timestampGutterWidth <= 0}
            tabIndex={timestampGutterWidth > 0 ? 0 : -1}
          />
        </div>

        <div
          className={`mt-3 grid grid-cols-2 gap-2 transition-opacity ${
            timestampGutterWidth > 0 ? "opacity-100" : "pointer-events-none opacity-40"
          }`}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase text-slate-400">
              Size
            </span>
            <input
              className="w-full accent-blue-500"
              type="range"
              min="8"
              max="28"
              step="1"
              value={timestampFontSize}
              onChange={(e) => setTimestampFontSize(Number(e.target.value))}
              tabIndex={timestampGutterWidth > 0 ? 0 : -1}
            />
            <span className="text-xs text-slate-400">{timestampFontSize}px</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase text-slate-400">
              Color
            </span>
            <input
              className="h-9 w-full cursor-pointer rounded border border-slate-700 bg-transparent p-1"
              type="color"
              value={timestampColor}
              onChange={(e) => setTimestampColor(e.target.value)}
              tabIndex={timestampGutterWidth > 0 ? 0 : -1}
            />
          </label>
        </div>
      </div>

      <div className="panel mt-3" data-tutorial="layer-list">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setLayerListOpen((v) => !v)}
          title={layerListOpen ? "Collapse layer list" : "Expand layer list"}
        >
          <div>
            <p className="font-black">Layer list</p>
            <p className="text-sm text-slate-400">
              {activePage.layers.length} layers
            </p>
          </div>

          <span className="text-lg text-slate-400">
            {layerListOpen ? "▾" : "▸"}
          </span>
        </button>

        {layerListOpen && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1">
              <button
                className="tool-btn h-9 px-2"
                onClick={() => setAllLayerVisibility(false)}
                title="Hide all layers"
              >
                <EyeOff size={15} /> Hide all
              </button>
              <button
                className="tool-btn h-9 px-2"
                onClick={() => setAllLayerVisibility(true)}
                title="Show all layers"
              >
                <Eye size={15} /> Show all
              </button>
              <button
                className="tool-btn h-9 px-2"
                onClick={() => setAllLayerLocks(true)}
                title="Lock all layers"
              >
                <Lock size={15} /> Lock all
              </button>
              <button
                className="tool-btn h-9 px-2"
                onClick={() => setAllLayerLocks(false)}
                title="Unlock all layers"
              >
                <LockOpen size={15} /> Unlock all
              </button>
            </div>

            {selectedLayerIds.length > 0 && (
              <div className="rounded-xl bg-slate-950 p-1">
                <div className="mb-1 grid grid-cols-2 gap-1">
                  <button
                    className="tool-btn h-9 px-2 text-red-200 hover:bg-red-500/20"
                    onClick={deleteSelectedLayers}
                    title="Delete selected layers"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                  <button
                    className="tool-btn h-9 px-2 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={selectedLayerIds.length < 2}
                    onClick={groupSelectedLayers}
                    title="Group selected layers"
                  >
                    <Layers size={15} /> Group
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-1">
                <button
                  className="tool-btn h-9 px-0"
                  onClick={() => reorderSelectedLayers("front")}
                  title="Bring to front"
                >
                  <ChevronsUp size={16} />
                </button>
                <button
                  className="tool-btn h-9 px-0"
                  onClick={() => reorderSelectedLayers("forward")}
                  title="Bring forward"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="tool-btn h-9 px-0"
                  onClick={duplicateSelectedLayers}
                  title="Duplicate selected layer"
                >
                  <Copy size={16} />
                </button>
                <button
                  className="tool-btn h-9 px-0"
                  onClick={() => reorderSelectedLayers("backward")}
                  title="Send backward"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  className="tool-btn h-9 px-0"
                  onClick={() => reorderSelectedLayers("back")}
                  title="Send to back"
                >
                  <ChevronsDown size={16} />
                </button>
                </div>
              </div>
            )}

            {layerEntries.map((entry) => {
              if (entry.type === "layer") {
                return renderLayerRow(entry.layer);
              }

              return renderGroup(entry);
            })}
          </div>
        )}
      </div>

      {lockToRegions && (
      <div className="panel mt-3">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setSafeZonesOpen((v) => !v)}
          title={safeZonesOpen ? "Collapse safe zones" : "Expand safe zones"}
        >
          <div>
            <p className="font-black">Safe zones</p>
            <p className="text-sm text-slate-400">{safeZones.length} zones</p>
          </div>

          <span className="text-lg text-slate-400">
            {safeZonesOpen ? "▾" : "▸"}
          </span>
        </button>

        {safeZonesOpen && (
          <div className="mt-3 space-y-2">
            {safeZones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => {
                  setSelectedLayerId(null);
                  setSelectedLayerIds([]);
                  setSelectedSafeZoneId(zone.id);
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
        )}
      </div>
      )}
    </div>
  );
}
