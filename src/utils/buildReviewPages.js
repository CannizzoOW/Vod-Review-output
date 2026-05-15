import { uid } from "./parsing.js";
import { makeDefaultBackgroundRectLayer, makePageTitleLayer, makeFooterLayer, makeTextSegmentGroupPatch } from "./layerFactory.js";
import { makeAutoTextLayerAtY } from "./canvas.js";
import { getPageTemplateStyle, getSafeZonesForTemplateStyle } from "./constants.js";

export function buildReviewPages({ form, segments = [], safeZones = [], safeZoneOptions = {} }) {
  const firstPageTemplateStyle = getPageTemplateStyle(form.hero, form.templateStyle, 0);
  const firstPageSafeZones = getSafeZonesForTemplateStyle(safeZones, firstPageTemplateStyle, safeZoneOptions);
  let mainZone = firstPageSafeZones.find((zone) => zone.id === "mainText") || firstPageSafeZones[0];
  const titleLayer = makePageTitleLayer("VOD FEEDBACK", firstPageTemplateStyle);
  const footerLayer = makeFooterLayer(form);

  const firstPage = {
    id: uid(),
    title: "VOD FEEDBACK",
    isCoverPage: true,
    layers: [makeDefaultBackgroundRectLayer("VOD FEEDBACK", firstPageTemplateStyle), titleLayer, footerLayer],
  };

  if (!mainZone || !segments.length) {
    return [firstPage];
  }

  let pages = [firstPage];
  let currentPage = firstPage;
  let currentTextGroup = makeTextSegmentGroupPatch();
  let padding = mainZone.padding || 20;
  let gap = mainZone.gap || 16;
  let startY = mainZone.y + padding;
  let maxY = mainZone.y + mainZone.h - padding;
  let y = startY;

  function setPageSafeZones(pageIndex) {
    const pageTemplateStyle = getPageTemplateStyle(form.hero, form.templateStyle, pageIndex);
    const pageSafeZones = getSafeZonesForTemplateStyle(safeZones, pageTemplateStyle, safeZoneOptions);

    mainZone = pageSafeZones.find((zone) => zone.id === "mainText") || pageSafeZones[0];
    padding = mainZone.padding || 20;
    gap = mainZone.gap || 16;
    startY = mainZone.y + padding;
    maxY = mainZone.y + mainZone.h - padding;
  }

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
          const pageTemplateStyle = getPageTemplateStyle(form.hero, form.templateStyle, pages.length);

          const newPage = {
            id: uid(),
            title: pageTitle,
            isCoverPage: false,
            layers: [
              makeDefaultBackgroundRectLayer(pageTitle, pageTemplateStyle),
              makePageTitleLayer(pageTitle, pageTemplateStyle),
              makeFooterLayer(form),
            ],
          };

          pages.push(newPage);
          currentPage = newPage;
          currentTextGroup = makeTextSegmentGroupPatch();
          setPageSafeZones(pages.length - 1);

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
      const pageTemplateStyle = getPageTemplateStyle(form.hero, form.templateStyle, pages.length);

      const newPage = {
        id: uid(),
        title: pageTitle,
        isCoverPage: false,
        layers: [
          makeDefaultBackgroundRectLayer(pageTitle, pageTemplateStyle),
          makePageTitleLayer(pageTitle, pageTemplateStyle),
          makeFooterLayer(form),
        ],
      };

      pages.push(newPage);
      currentPage = newPage;
      currentTextGroup = makeTextSegmentGroupPatch();
      setPageSafeZones(pages.length - 1);

      y = startY;

      layer = makeAutoTextLayerAtY({
        segment,
        zone: mainZone,
        y,
      });
    }

    currentPage.layers.push({
      ...layer,
      ...currentTextGroup,
    });

    y = layer.y + layer.h + gap;
  }

  return pages;
}
