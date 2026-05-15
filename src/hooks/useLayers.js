import { useState } from "react";
import { snap, clampToZones } from "../utils/canvas.js";
import { estimateTextHeight } from "../utils/textUtils.js";
import { DEFAULT_SAFE_ZONES, getSafeZonesForTemplateStyle, pageHasScreenshotContent } from "../utils/constants.js";

export function useLayers(pages, activePageId, setPages, gridEnabled, lockToRegions, activeTemplateStyle = "", safeZoneOptions = {}) {
  const [safeZones, setSafeZones] = useState(DEFAULT_SAFE_ZONES);
  const [selectedSafeZoneId, setSelectedSafeZoneId] = useState(null);
  const activePage = pages.find((page) => page.id === activePageId) || pages[0];
  const fullWidthText = safeZoneOptions.fullWidthText && !pageHasScreenshotContent(activePage, safeZones);
  const effectiveSafeZones = getSafeZonesForTemplateStyle(safeZones, activeTemplateStyle, {
    ...safeZoneOptions,
    fullWidthText,
  });

  const selectedSafeZone = effectiveSafeZones.find((z) => z.id === selectedSafeZoneId);

  function updateActivePageLayers(updater) {
    setPages((prev) =>
      prev.map((page) =>
        page.id === activePageId ? { ...page, layers: updater(page.layers) } : page
      )
    );
  }

  function setLayer(layerId, patch, options = {}) {
    const shouldSnap = options.snapToGrid ?? false;

    updateActivePageLayers((layers) => {
      let updatedTargetLayer = null;
      const nextLayers = layers.map((layer) => {
        if (layer.id !== layerId) return layer;

        let next = { ...layer, ...patch };

        if (next.kind === "text" && next.autoFlow) {
          const padding = Number(next.padding) || 0;

          next.h = estimateTextHeight(
            next.text,
            next.w - (next.timestampGutter || 0) - padding * 2,
            next.fontSize
          ) + padding * 2;
        }

        if (gridEnabled && shouldSnap) {
          next.x = snap(next.x, 10);
          next.y = snap(next.y, 10);
          next.w = snap(next.w, 10);
          next.h = snap(next.h, 10);
        }

        if (lockToRegions) {
          next = clampToZones(next, effectiveSafeZones);
        }

        updatedTargetLayer = next;
        return next;
      });

      if (
        updatedTargetLayer?.kind === "text" &&
        updatedTargetLayer.groupId
      ) {
        return nextLayers.map((layer) => {
          if (
            layer.groupId !== updatedTargetLayer.groupId ||
            layer.kind !== "shape" ||
            layer.name !== "Description background"
          ) {
            return layer;
          }

          return {
            ...layer,
            x: updatedTargetLayer.x,
            y: updatedTargetLayer.y,
            w: updatedTargetLayer.w,
            h: updatedTargetLayer.h,
          };
        });
      }

      return nextLayers;
    });
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
      next = clampToZones(next, effectiveSafeZones);
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
