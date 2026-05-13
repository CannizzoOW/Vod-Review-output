import { uid } from "./parsing.js";
import { makeDefaultBackgroundRectLayer, makePageTitleLayer, makeFooterLayer } from "./layerFactory.js";
import { makeAutoTextLayerAtY } from "./canvas.js";

export function buildReviewPages({ form, segments = [], safeZones = [] }) {
  const mainZone = safeZones.find((zone) => zone.id === "mainText") || safeZones[0];

  const titleLayer = makePageTitleLayer("VOD FEEDBACK");
  const footerLayer = makeFooterLayer(form);

  const firstPage = {
    id: uid(),
    title: "VOD FEEDBACK",
    isCoverPage: true,
    layers: [makeDefaultBackgroundRectLayer("VOD FEEDBACK"), titleLayer, footerLayer],
  };

  if (!mainZone || !segments.length) {
    return [firstPage];
  }

  const padding = mainZone.padding || 20;
  const gap = mainZone.gap || 16;
  const startY = mainZone.y + padding;
  const maxY = mainZone.y + mainZone.h - padding;

  let pages = [firstPage];
  let currentPage = firstPage;
  let y = startY;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    let layer = makeAutoTextLayerAtY({
      segment,
      zone: mainZone,
      y,
    });

    /*
      KEEP HEADING WITH NEXT BLOCK
    */

    if (segment.type === "heading") {
      const nextSegment = segments[i + 1];

      if (nextSegment) {
        const nextLayer = makeAutoTextLayerAtY({
          segment: nextSegment,
          zone: mainZone,
          y: layer.y + layer.h + gap,
        });

        const combinedBottom =
          nextLayer.y + nextLayer.h;

        if (combinedBottom > maxY) {
          const pageTitle = `Page ${pages.length}`;

          const newPage = {
            id: uid(),
            title: pageTitle,
            isCoverPage: false,
            layers: [
              makeDefaultBackgroundRectLayer(pageTitle),
              makePageTitleLayer(pageTitle),
              makeFooterLayer(form),
            ],
          };

          pages.push(newPage);
          currentPage = newPage;

          y = startY;

          layer = makeAutoTextLayerAtY({
            segment,
            zone: mainZone,
            y,
          });
        }
      }
    }

    /*
      NORMAL OVERFLOW CHECK
    */

    if (layer.y + layer.h > maxY) {
      const pageTitle = `Page ${pages.length}`;

      const newPage = {
        id: uid(),
        title: pageTitle,
        isCoverPage: false,
        layers: [
          makeDefaultBackgroundRectLayer(pageTitle),
          makePageTitleLayer(pageTitle),
          makeFooterLayer(form),
        ],
      };

      pages.push(newPage);
      currentPage = newPage;

      y = startY;

      layer = makeAutoTextLayerAtY({
        segment,
        zone: mainZone,
        y,
      });
    }

    currentPage.layers.push(layer);

    y = layer.y + layer.h + gap;
  }

  return pages;
}
