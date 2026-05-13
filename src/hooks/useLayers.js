import { useState } from "react";
import { snap, clampToZones } from "../utils/canvas.js";
import { estimateTextHeight } from "../utils/textUtils.js";
import { DEFAULT_SAFE_ZONES } from "../utils/constants.js";

export function useLayers(pages, activePageId, setPages, gridEnabled, lockToRegions) {
  const [safeZones, setSafeZones] = useState(DEFAULT_SAFE_ZONES);
  const [selectedSafeZoneId, setSelectedSafeZoneId] = useState(null);

  const activePage = pages.find((p) => p.id === activePageId);
  const selectedSafeZone = safeZones.find((z) => z.id === selectedSafeZoneId);

  function updateActivePageLayers(updater) {
    setPages((prev) =>
      prev.map((page) =>
        page.id === activePageId ? { ...page, layers: updater(page.layers) } : page
      )
    );
  }

  function setLayer(layerId, patch, options = {}) {
    const shouldSnap = options.snapToGrid ?? false;

    updateActivePageLayers((layers) =>
      layers.map((layer) => {
        if (layer.id !== layerId) return layer;

        let next = { ...layer, ...patch };

        if (next.kind === "text" && next.autoFlow) {
          next.h = estimateTextHeight(
            next.text,
            next.w - (next.timestampGutter || 0),
            next.fontSize
          );
        }

        if (gridEnabled && shouldSnap) {
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

  function setSafeZone(zoneId, patch, options = {}) {
    const shouldSnap = options.snapToGrid ?? false;

    setSafeZones((prev) =>
      prev.map((zone) => {
        if (zone.id !== zoneId) return zone;

        let next = { ...zone, ...patch };

        if (gridEnabled && shouldSnap) {
          next.x = snap(next.x, 10);
          next.y = snap(next.y, 10);
          next.w = snap(next.w, 10);
          next.h = snap(next.h, 10);
        }

        return next;
      })
    );
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
  }

  function removeLayer(id, syncSegmentUsage) {
    let nextPagesSnapshot = null;

    setPages((prev) => {
      nextPagesSnapshot = prev.map((page) =>
        page.id === activePageId
          ? {
            ...page,
            layers: page.layers.filter((layer) => layer.id !== id),
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
  }

  return {
    safeZones,
    setSafeZones,
    selectedSafeZone,
    selectedSafeZoneId,
    setSelectedSafeZoneId,
    setLayer,
    setSafeZone,
    addLayer,
    removeLayer,
  };
}
