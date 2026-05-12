import { useState } from "react";

export function useSelection(pages, activePageId, setPages) {
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState([]);
  const [selectedSafeZoneId, setSelectedSafeZoneId] = useState(null);
  const [tool, setTool] = useState("select");

  const activePage = pages.find((p) => p.id === activePageId);
  const selectedLayer = activePage?.layers.find((l) => l.id === selectedLayerId);

  function deselectAll() {
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setSelectedSafeZoneId(null);
  }

  function selectLayer(layerId, additive = false) {
    setSelectedSafeZoneId(null);

    if (!layerId) {
      setSelectedLayerId(null);
      setSelectedLayerIds([]);
      return;
    }

    if (additive) {
      setSelectedLayerIds((prev) => {
        const next = prev.includes(layerId)
          ? prev.filter((id) => id !== layerId)
          : [...prev, layerId];

        setSelectedLayerId(next[next.length - 1] || null);
        return next;
      });

      return;
    }

    setSelectedLayerId(layerId);
    setSelectedLayerIds([layerId]);
  }

  function selectSafeZone(zoneId) {
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setSelectedSafeZoneId(zoneId);
  }

  function deleteSelectedLayers(syncSegmentUsage) {
    const idsToDelete = selectedLayerIds.length
      ? selectedLayerIds
      : selectedLayerId
        ? [selectedLayerId]
        : [];

    if (!idsToDelete.length) return;

    let nextPagesSnapshot = null;

    setPages((prev) => {
      nextPagesSnapshot = prev.map((page) =>
        page.id === activePageId
          ? {
            ...page,
            layers: page.layers.filter(
              (layer) => !idsToDelete.includes(layer.id)
            ),
          }
          : page
      );

      return nextPagesSnapshot;
    });

    setTimeout(() => {
      if (nextPagesSnapshot) {
        syncSegmentUsage(nextPagesSnapshot);
      }
    }, 0);

    setSelectedLayerId(null);
    setSelectedLayerIds([]);
  }

  return {
    selectedLayerId,
    setSelectedLayerId,
    selectedLayerIds,
    setSelectedLayerIds,
    selectedSafeZoneId,
    setSelectedSafeZoneId,
    selectedLayer,
    tool,
    setTool,
    deselectAll,
    selectLayer,
    selectSafeZone,
    deleteSelectedLayers,
  };
}
