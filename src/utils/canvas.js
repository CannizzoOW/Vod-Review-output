import { makeTextLayer } from "./layerFactory.js";
import { estimateTextHeight } from "./textUtils.js";

export function snap(value, grid) {
  return Math.round(value / grid) * grid;
}

export function clampToZones(layer, safeZones) {
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

export function autoPlaceInZone({ segment, zone, layers }) {
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

export function makeAutoTextLayerAtY({ segment, zone, y }) {
  const padding = zone.padding || 20;
  const width = zone.w - padding * 2;

  const layer = makeTextLayer(segment, zone.x + padding, y);

  layer.zoneId = zone.id;
  layer.autoFlow = true;
  layer.w = width;
  layer.h = estimateTextHeight(layer.text, width, layer.fontSize);

  return layer;
}
