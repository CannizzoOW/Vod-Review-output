import { uid } from "./parsing.js";

const PAGE_TITLE_RECT_MIN_W = 360;
const PAGE_TITLE_RECT_H = 70;
const PAGE_TITLE_RECT_Y = 380;
const PAGE_TITLE_CENTER_X = 540;
const PAGE_TITLE_TEXT_Y_OFFSET = 17;
const PAGE_TITLE_TEXT_H = 40;
const PAGE_TITLE_FONT_SIZE = 30;
const PAGE_TITLE_HORIZONTAL_PADDING = 52;
const PAGE_TITLE_MAX_W = 920;
const PAGE_TWO_TITLE_RECT_LAYOUT = {
  x: 360,
  y: 162,
  w: 360,
  h: 70,
};
const PAGE_TWO_TITLE_TEXT_LAYOUT = {
  x: 360,
  y: 179,
  w: 360,
  h: 40,
};
const PAGE_TITLE_GROUP_ID = "page-title-group";
const PAGE_TITLE_GROUP_NAME = "VOD Feedback";
const TEXT_SEGMENT_GROUP_NAME = "Text segments";
const IMAGE_GROUP_NAME = "Image";
const IMAGE_DESCRIPTION_GROUP_NAME = "Description";

export function makeTextSegmentGroupPatch(groupId = uid()) {
  return {
    groupId,
    groupName: TEXT_SEGMENT_GROUP_NAME,
  };
}

export function isPageTwoTemplate(templateStyle = "") {
  return /(?:^|-)page-2(?:$|-)/i.test(String(templateStyle || ""));
}

export function getPageTitleLayout(title = "VOD FEEDBACK", templateStyle = "") {
  if (isPageTwoTemplate(templateStyle)) {
    return {
      rect: { ...PAGE_TWO_TITLE_RECT_LAYOUT },
      text: { ...PAGE_TWO_TITLE_TEXT_LAYOUT },
    };
  }

  const text = String(title || "VOD FEEDBACK").trim() || "VOD FEEDBACK";
  const estimatedTextWidth = text.length * PAGE_TITLE_FONT_SIZE * 0.62;
  const width = Math.min(
    PAGE_TITLE_MAX_W,
    Math.max(PAGE_TITLE_RECT_MIN_W, Math.ceil(estimatedTextWidth + PAGE_TITLE_HORIZONTAL_PADDING))
  );
  const x = Math.round(PAGE_TITLE_CENTER_X - width / 2);

  return {
    rect: {
      x,
      y: PAGE_TITLE_RECT_Y,
      w: width,
      h: PAGE_TITLE_RECT_H,
    },
    text: {
      x,
      y: PAGE_TITLE_RECT_Y + PAGE_TITLE_TEXT_Y_OFFSET,
      w: width,
      h: PAGE_TITLE_TEXT_H,
    },
  };
}

export function syncPageTitleLayers(layers, title = "VOD FEEDBACK", templateStyle = "") {
  const nextRect = makeDefaultBackgroundRectLayer(title, templateStyle);
  const nextTitle = makePageTitleLayer(title, templateStyle);
  const hasRect = layers.some((layer) => layer.id === "default-background-rect");
  const hasTitle = layers.some((layer) => layer.id === "page-title");

  if (!hasRect && !hasTitle) {
    return [nextRect, nextTitle, ...layers];
  }

  const syncedLayers = layers.map((layer) => {
    if (layer.id === "default-background-rect") {
      return { ...layer, ...nextRect };
    }

    if (layer.id === "page-title") {
      return { ...layer, ...nextTitle };
    }

    return layer;
  });

  if (!hasRect) {
    const titleIndex = syncedLayers.findIndex((layer) => layer.id === "page-title");
    return [
      ...syncedLayers.slice(0, Math.max(0, titleIndex)),
      nextRect,
      ...syncedLayers.slice(Math.max(0, titleIndex)),
    ];
  }

  if (!hasTitle) {
    const rectIndex = syncedLayers.findIndex((layer) => layer.id === "default-background-rect");
    return [
      ...syncedLayers.slice(0, rectIndex + 1),
      nextTitle,
      ...syncedLayers.slice(rectIndex + 1),
    ];
  }

  return syncedLayers;
}

export function makeTextLayer(segment, x = 80, y = 380) {
  return {
    id: uid(),
    kind: "text",
    visible: true,
    sourceSegmentId: segment.id,
    timestamp: segment.timestamp || "",
    timestampGutter: segment.type === "heading" ? 0 : 84,
    color: "#000000",
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
        : segment.text,
  };
}

export function makeImageLayer(source, x = 700, y = 420) {
  const imageSource = typeof source === "string" ? { src: source } : source || {};
  const naturalW = Number(imageSource.naturalWidth) || 0;
  const naturalH = Number(imageSource.naturalHeight) || 0;
  const aspectRatio = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : 16 / 9;
  const maxW = 330;
  const maxH = 520;
  let w = maxW;
  let h = Math.round(w / aspectRatio);

  if (h > maxH) {
    h = maxH;
    w = Math.round(h * aspectRatio);
  }

  return {
    id: uid(),
    kind: "image",
    visible: true,
    x,
    y,
    w,
    h,
    src: imageSource.src || "",
    naturalW,
    naturalH,
  };
}

export function makeImageDescriptionLayer(imageLayer, groupPatch = {}, text = "Screenshot note") {
  return {
    id: uid(),
    kind: "text",
    visible: true,
    color: "#ffffff",
    x: imageLayer.x,
    y: imageLayer.y + imageLayer.h + 12,
    w: imageLayer.w,
    h: 52,
    fontSize: 18,
    padding: 10,
    weight: 900,
    italic: false,
    align: "center",
    verticalAlign: "center",
    markdown: false,
    autoFlow: true,
    zoneId: imageLayer.zoneId || null,
    text,
    ...groupPatch,
  };
}

export function makeImageDescriptionBackgroundLayer(descriptionLayer, groupPatch = {}) {
  return {
    id: uid(),
    kind: "shape",
    visible: true,
    shapeType: "rectangle",
    x: descriptionLayer.x,
    y: descriptionLayer.y,
    w: descriptionLayer.w,
    h: descriptionLayer.h,
    rotation: 0,
    fillMode: "filled",
    fillColor: "#25274f",
    fillOpacity: 1,
    strokeColor: "#25274f",
    strokeOpacity: 0,
    strokeWidth: 1,
    zoneId: descriptionLayer.zoneId || null,
    name: "Description background",
    ...groupPatch,
  };
}

export function makeImageGroupPatch(groupId = uid()) {
  return {
    groupId,
    groupName: IMAGE_GROUP_NAME,
  };
}

export function makeImageDescriptionGroupPatch(parentGroup, groupId = uid()) {
  return {
    groupId,
    groupName: IMAGE_DESCRIPTION_GROUP_NAME,
    parentGroupId: parentGroup.groupId,
    parentGroupName: parentGroup.groupName,
  };
}

export function makeEmojiLayer(emoji, x = 500, y = 620) {
  return {
    id: uid(),
    kind: "emoji",
    visible: true,
    emojiId: emoji.id,
    name: emoji.name,
    src: emoji.src,
    href: emoji.href,
    x,
    y,
    w: 150,
    h: 150,
    rotation: 0,
  };
}

export function makeShapeLayer(shapeType = "rectangle", x = 430, y = 610) {
  const isLinear = shapeType === "line" || shapeType === "arrow";
  const isCircle = shapeType === "circle";

  return {
    id: uid(),
    kind: "shape",
    visible: true,
    shapeType,
    x,
    y,
    w: isLinear ? 320 : isCircle ? 220 : 360,
    h: isLinear ? 70 : isCircle ? 220 : 180,
    rotation: 0,
    fillMode: isLinear ? "hollow" : "filled",
    fillColor: "#2563eb",
    fillOpacity: isLinear ? 0 : 1,
    strokeColor: "#f8fafc",
    strokeOpacity: 1,
    strokeWidth: 6,
  };
}

export function makeDefaultBackgroundRectLayer(title = "VOD FEEDBACK", templateStyle = "") {
  const layout = getPageTitleLayout(title, templateStyle);

  return {
    id: "default-background-rect",
    kind: "shape",
    visible: true,
    shapeType: "rectangle",
    x: layout.rect.x,
    y: layout.rect.y,
    w: layout.rect.w,
    h: layout.rect.h,
    rotation: 0,
    fillMode: "filled",
    fillColor: "#75819a",
    fillOpacity: 1,
    strokeColor: "#75819a",
    strokeOpacity: 0,
    strokeWidth: 1,
    groupId: PAGE_TITLE_GROUP_ID,
    groupName: PAGE_TITLE_GROUP_NAME,
    locked: true,
  };
}

export function makeFooterLayer(form) {
  return {
    id: "footer-info",
    kind: "text",
    visible: true,
    color: "#e7e6e6",
    x: 0,
    y: 1482,
    w: 1080,
    h: 39,
    fontSize: 19,
    weight: 900,
    align: "center",
    italic: false,
    markdown: false,
    autoFlow: false,
    zoneId: "footerSafe",
    locked: true,
    text: `VOD REVIEW  | @${form.player || "USERNAME"} | FOR QUESTIONS, PING @${form.reviewer || "COACH"} | REPLAY ID: ${form.replayId || ""}`,
  };
}

export function makePageTitleLayer(title, templateStyle = "") {
  const layout = getPageTitleLayout(title, templateStyle);

  return {
    id: "page-title",
    kind: "text",
    visible: true,
    color: "#e7e6e6",
    x: layout.text.x,
    y: layout.text.y,
    w: layout.text.w,
    h: layout.text.h,
    fontSize: PAGE_TITLE_FONT_SIZE,
    weight: 900,
    italic: false,
    align: "center",
    markdown: false,
    autoFlow: false,
    zoneId: null,
    groupId: PAGE_TITLE_GROUP_ID,
    groupName: PAGE_TITLE_GROUP_NAME,
    locked: true,
    text: title || "VOD FEEDBACK",
  };
}
