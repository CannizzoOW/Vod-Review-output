import { useState } from "react";
import { parseDiscordReview } from "../utils/parsing.js";
import { autoPlaceInZone, makeAutoTextLayerAtY } from "../utils/canvas.js";
import { SAMPLE_REVIEW } from "../utils/constants.js";

export function useSegments(pages, activePageId, setPages) {
  const [rawText, setRawText] = useState(SAMPLE_REVIEW);
  const [segments, setSegments] = useState(
    () => parseDiscordReview(SAMPLE_REVIEW).segments
  );
  const [selectedSegmentId, setSelectedSegmentId] = useState(null);

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);

  function runParser() {
    const parsed = parseDiscordReview(rawText);
    setSegments(parsed.segments);
    setSelectedSegmentId(parsed.segments[0]?.id || null);
  }

  function markSegmentUsed(id, used) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, used } : s)));
  }

  function syncSegmentUsage(nextPages) {
    const usedSegmentIds = new Set();

    for (const page of nextPages) {
      for (const layer of page.layers || []) {
        if (layer.sourceSegmentId) {
          usedSegmentIds.add(layer.sourceSegmentId);
        }
      }
    }

    setSegments((prev) =>
      prev.map((segment) => ({
        ...segment,
        used: usedSegmentIds.has(segment.id),
      }))
    );
  }

  function autoPlaceAllSegments(safeZones) {
    const zone = safeZones.find((z) => z.id === "mainText") || safeZones[0];

    if (!zone) return;

    const segmentsToPlace = segments.filter((segment) => !segment.used);

    if (!segmentsToPlace.length) {
      alert("No unused segments to auto-place.");
      return;
    }

    const padding = zone.padding || 20;
    const gap = zone.gap || 16;
    const startY = zone.y + padding;
    const maxY = zone.y + zone.h - padding;

    const PAGE_W = 1080;
    const PAGE_H = 1527;

    const activeIndex = pages.findIndex((page) => page.id === activePageId);
    const basePages = [...pages];

    let workingPages = basePages.map((page) => ({
      ...page,
      layers: [...page.layers],
    }));

    let pageIndex = activeIndex >= 0 ? activeIndex : 0;
    let currentPage = workingPages[pageIndex];

    let y = startY;

    const existingZoneLayers = currentPage.layers.filter(
      (layer) => layer.zoneId === zone.id && layer.kind === "text"
    );

    for (const layer of existingZoneLayers) {
      y = Math.max(y, layer.y + layer.h + gap);
    }

    for (const segment of segmentsToPlace) {
      let layer = makeAutoTextLayerAtY({ segment, zone, y });

      if (layer.y + layer.h > maxY) {
        const newPage = {
          id: crypto.randomUUID(),
          layers: [],
        };

        workingPages.push(newPage);
        pageIndex = workingPages.length - 1;
        currentPage = workingPages[pageIndex];

        y = startY;
        layer = makeAutoTextLayerAtY({ segment, zone, y });
      }

      currentPage.layers.push(layer);
      y = layer.y + layer.h + gap;
    }

    setPages(workingPages);

    setSegments((prev) =>
      prev.map((segment) =>
        segmentsToPlace.some((placed) => placed.id === segment.id)
          ? { ...segment, used: true }
          : segment
      )
    );
  }

  return {
    rawText,
    setRawText,
    segments,
    setSegments,
    selectedSegmentId,
    setSelectedSegmentId,
    selectedSegment,
    runParser,
    markSegmentUsed,
    syncSegmentUsage,
    autoPlaceAllSegments,
  };
}
