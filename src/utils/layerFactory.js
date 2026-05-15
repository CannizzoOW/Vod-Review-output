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
const COMPARISON_GROUP_NAME = "Comparison";

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

export function syncPageTitleLayers(layers, title = "VOD FEEDBACK", templateStyle = "", titleBackgroundColor) {
  const nextRect = makeDefaultBackgroundRectLayer(title, templateStyle, titleBackgroundColor);
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
    segmentType: segment.type,
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
    underline: false,
    strikethrough: false,
    markdown: true,
    autoFlow: false,
    zoneId: null,
    text:
      segment.type === "heading"
        ? segment.text.toUpperCase()
        : segment.text,
  };
}

export function makeFreeTextLayer(x = 80, y = 380) {
  return {
    id: uid(),
    kind: "text",
    visible: true,
    color: "#000000",
    x,
    y,
    w: 420,
    h: 80,
    fontSize: 24,
    weight: 500,
    italic: false,
    underline: false,
    strikethrough: false,
    align: "left",
    markdown: true,
    autoFlow: false,
    zoneId: null,
    text: "Text",
    name: "Text",
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
    underline: false,
    strikethrough: false,
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

export function makeComparisonLayers(
  {
    heading = "",
    leftImage = "",
    rightImage = "",
    leftLabel = "Good",
    rightLabel = "Not optimal",
    leftCaption = "",
    rightCaption = "",
    takeaway = "",
    showHeading = true,
    showLeftLabel = true,
    showRightLabel = true,
    showLeftCaption = true,
    showRightCaption = true,
    showTakeaway = true,
    layoutScale = 1,
    layoutMode = "side-by-side",
    markerStyle = "color-bars",
    themeColor = "#334155",
  } = {},
  x = 90,
  y = 430,
  existingGroupId
) {
  const groupId = existingGroupId || uid();
  const groupPatch = {
    groupId,
    groupName: COMPARISON_GROUP_NAME,
    comparisonData: {
      heading,
      leftImage,
      rightImage,
      leftLabel,
      rightLabel,
      leftCaption,
      rightCaption,
      takeaway,
      showHeading,
      showLeftLabel,
      showRightLabel,
      showLeftCaption,
      showRightCaption,
      showTakeaway,
      layoutScale,
      layoutMode,
      markerStyle,
      themeColor,
    },
  };
  if (layoutMode === "over-under" || layoutMode === "compact") {
    return makeCompactComparisonLayers({
      heading,
      leftImage,
      rightImage,
      leftLabel,
      rightLabel,
      leftCaption,
      rightCaption,
      takeaway,
      showHeading,
      showLeftLabel,
      showRightLabel,
      showLeftCaption,
      showRightCaption,
      showTakeaway,
      markerStyle,
      themeColor,
      groupPatch,
      x,
      y,
    });
  }
  const scaled = (value) => Math.round(value * layoutScale);
  const panelColor = markerStyle === "marks"
    ? mixHex(themeColor, "#020617", 0.42)
    : mixHex(themeColor, "#020617", 0.78);
  const goodBarColor = markerStyle === "marks"
    ? mixHex(themeColor, "#475569", 0.35)
    : mixHex(themeColor, "#15803d", 0.62);
  const badBarColor = markerStyle === "marks"
    ? mixHex(themeColor, "#475569", 0.35)
    : mixHex(themeColor, "#b91c1c", 0.62);
  const panelW = scaled(900);
  const topPadding = scaled(20);
  const headingSectionH = showHeading ? scaled(48) : 0;
  const imageY = y + topPadding + headingSectionH;
  const imageW = scaled(410);
  const imageH = scaled(230);
  const rightX = x + scaled(470);
  const hasAnyLabel = showLeftLabel || showRightLabel;
  const labelSectionH = hasAnyLabel ? scaled(56) : scaled(12);
  const captionY = imageY + imageH + labelSectionH;
  const hasAnyCaption = showLeftCaption || showRightCaption;
  const captionSectionH = hasAnyCaption ? scaled(76) : 0;
  const takeawayY = captionY + captionSectionH;
  const takeawaySectionH = showTakeaway ? scaled(52) : 0;
  const panelH = takeawayY + takeawaySectionH + scaled(20) - y;
  const layers = [
    {
      ...makeShapeLayer("rectangle", x, y),
      x,
      y,
      w: panelW,
      h: panelH,
      fillColor: panelColor,
      fillOpacity: 0.94,
      strokeColor: panelColor,
      strokeOpacity: 0,
      strokeWidth: 1,
      name: "Comparison background",
      comparisonRole: "background",
      internalComparisonShape: true,
      ...groupPatch,
    },
  ];

  if (showHeading) {
    layers.push(makeComparisonTextLayer({
      text: heading,
      x: x + scaled(20),
      y: y + scaled(18),
      w: panelW - scaled(40),
      h: scaled(30),
      fontSize: Math.max(10, scaled(24)),
      weight: 900,
      color: "#f8fafc",
      align: "center",
      comparisonRole: "heading",
      ...groupPatch,
    }));
  }

  layers.push(
    {
      ...makeImageLayer(leftImage, x + scaled(20), imageY),
      x: x + scaled(20),
      y: imageY,
      w: imageW,
      h: imageH,
      objectFit: "contain",
      name: "Left comparison image",
      comparisonRole: "leftImage",
      locked: !leftImage,
      lockedToGroup: !leftImage,
      ...groupPatch,
    },
    {
      ...makeImageLayer(rightImage, rightX, imageY),
      x: rightX,
      y: imageY,
      w: imageW,
      h: imageH,
      objectFit: "contain",
      name: "Right comparison image",
      comparisonRole: "rightImage",
      locked: !rightImage,
      lockedToGroup: !rightImage,
      ...groupPatch,
    }
  );

  if (showLeftLabel) {
    layers.push(
      makeComparisonLabelBackgroundLayer(
        x + scaled(20),
        imageY + imageH + scaled(12),
        imageW,
        goodBarColor,
        "leftLabelBackground",
        groupPatch,
        layoutScale
      ),
      makeComparisonTextLayer({
      text: leftLabel,
      x: x + scaled(20),
      y: imageY + imageH + scaled(22),
      w: imageW,
      h: scaled(24),
      fontSize: Math.max(9, scaled(18)),
      weight: 900,
      color: "#ffffff",
      align: "center",
      verticalAlign: "center",
      comparisonRole: "leftLabel",
      ...groupPatch,
      })
    );
  }

  if (showRightLabel) {
    layers.push(
      makeComparisonLabelBackgroundLayer(
        rightX,
        imageY + imageH + scaled(12),
        imageW,
        badBarColor,
        "rightLabelBackground",
        groupPatch,
        layoutScale
      ),
      makeComparisonTextLayer({
      text: rightLabel,
      x: rightX,
      y: imageY + imageH + scaled(22),
      w: imageW,
      h: scaled(24),
      fontSize: Math.max(9, scaled(18)),
      weight: 900,
      color: "#ffffff",
      align: "center",
      verticalAlign: "center",
      comparisonRole: "rightLabel",
      ...groupPatch,
      })
    );
  }

  if (markerStyle === "marks") {
    layers.push(
      makeComparisonMarkLayer("✓", x + scaled(30), imageY - scaled(4), "#16a34a", "leftMark", scaled(54), groupPatch),
      makeComparisonMarkLayer("✕", rightX + scaled(10), imageY - scaled(4), "#dc2626", "rightMark", scaled(54), groupPatch)
    );
  }

  if (showLeftCaption) {
    layers.push(
    makeComparisonTextLayer({
      text: leftCaption,
      x: x + scaled(20),
      y: captionY,
      w: imageW,
      h: scaled(56),
      fontSize: Math.max(9, scaled(18)),
      padding: scaled(10),
      color: "#e2e8f0",
      comparisonRole: "leftCaption",
      ...groupPatch,
    })
    );
  }

  if (showRightCaption) {
    layers.push(
    makeComparisonTextLayer({
      text: rightCaption,
      x: rightX,
      y: captionY,
      w: imageW,
      h: scaled(56),
      fontSize: Math.max(9, scaled(18)),
      padding: scaled(10),
      color: "#e2e8f0",
      comparisonRole: "rightCaption",
      ...groupPatch,
    })
    );
  }

  if (showTakeaway) {
    layers.push(
    makeComparisonTextLayer({
      text: takeaway,
      x: x + scaled(20),
      y: takeawayY,
      w: panelW - scaled(40),
      h: scaled(40),
      fontSize: Math.max(9, scaled(19)),
      padding: scaled(14),
      weight: 800,
      color: "#bfdbfe",
      comparisonRole: "takeaway",
      ...groupPatch,
    })
    );
  }

  return layers;
}

function makeCompactComparisonLayers({
  heading,
  leftImage,
  rightImage,
  leftLabel,
  rightLabel,
  leftCaption,
  rightCaption,
  takeaway,
  showHeading,
  showLeftLabel,
  showRightLabel,
  showLeftCaption,
  showRightCaption,
  showTakeaway,
  groupPatch,
  x,
  y,
  markerStyle = "color-bars",
  themeColor = "#334155",
}) {
  const panelColor = markerStyle === "marks"
    ? mixHex(themeColor, "#020617", 0.42)
    : mixHex(themeColor, "#020617", 0.78);
  const goodBarColor = markerStyle === "marks"
    ? mixHex(themeColor, "#475569", 0.35)
    : mixHex(themeColor, "#15803d", 0.62);
  const badBarColor = markerStyle === "marks"
    ? mixHex(themeColor, "#475569", 0.35)
    : mixHex(themeColor, "#b91c1c", 0.62);
  const panelW = 328;
  const innerX = x + 16;
  const innerW = 296;
  const imageH = 166;
  let cursorY = y + 16;
  const layers = [];

  if (showHeading) {
    const headingH = estimateComparisonTextHeight(heading, innerW - 16, 20, 6);

    layers.push(
      makeComparisonHeadingBackgroundLayer(innerX, cursorY, innerW, headingH, groupPatch),
      makeComparisonTextLayer({
        text: heading,
        x: innerX,
        y: cursorY,
        w: innerW,
        h: headingH,
        fontSize: 20,
        padding: 6,
        weight: 900,
        color: "#f8fafc",
        align: "center",
        comparisonRole: "heading",
        ...groupPatch,
      })
    );
    cursorY += headingH + 12;
  }

  layers.push({
    ...makeImageLayer(leftImage, innerX, cursorY),
    x: innerX,
    y: cursorY,
    w: innerW,
    h: imageH,
    objectFit: "contain",
    name: "Left comparison image",
    comparisonRole: "leftImage",
    locked: !leftImage,
    lockedToGroup: !leftImage,
    ...groupPatch,
  });
  cursorY += imageH;

  if (showLeftLabel) {
    layers.push(
      makeComparisonLabelBackgroundLayer(
        innerX,
        cursorY + 10,
        innerW,
        goodBarColor,
        "leftLabelBackground",
        groupPatch
      ),
      makeComparisonTextLayer({
        text: leftLabel,
        x: innerX,
        y: cursorY + 19,
        w: innerW,
        h: 22,
        fontSize: 16,
        weight: 900,
        color: "#ffffff",
        align: "center",
        verticalAlign: "center",
        comparisonRole: "leftLabel",
        ...groupPatch,
      })
    );
    cursorY += 54;
  } else {
    cursorY += 12;
  }

  if (showLeftCaption) {
    layers.push(makeComparisonTextLayer({
      text: leftCaption,
      x: innerX,
      y: cursorY,
      w: innerW,
      h: 54,
      fontSize: 16,
      padding: 8,
      color: "#e2e8f0",
      comparisonRole: "leftCaption",
      ...groupPatch,
    }));
    cursorY += 62;
  }

  layers.push({
    ...makeImageLayer(rightImage, innerX, cursorY),
    x: innerX,
    y: cursorY,
    w: innerW,
    h: imageH,
    objectFit: "contain",
    name: "Right comparison image",
    comparisonRole: "rightImage",
    locked: !rightImage,
    lockedToGroup: !rightImage,
    ...groupPatch,
  });
  cursorY += imageH;

  if (showRightLabel) {
    layers.push(
      makeComparisonLabelBackgroundLayer(
        innerX,
        cursorY + 10,
        innerW,
        badBarColor,
        "rightLabelBackground",
        groupPatch
      ),
      makeComparisonTextLayer({
        text: rightLabel,
        x: innerX,
        y: cursorY + 19,
        w: innerW,
        h: 22,
        fontSize: 16,
        weight: 900,
        color: "#ffffff",
        align: "center",
        verticalAlign: "center",
        comparisonRole: "rightLabel",
        ...groupPatch,
      })
    );
    cursorY += 54;
  } else {
    cursorY += 12;
  }

  if (showRightCaption) {
    layers.push(makeComparisonTextLayer({
      text: rightCaption,
      x: innerX,
      y: cursorY,
      w: innerW,
      h: 54,
      fontSize: 16,
      padding: 8,
      color: "#e2e8f0",
      comparisonRole: "rightCaption",
      ...groupPatch,
    }));
    cursorY += 62;
  }

  if (showTakeaway) {
    const takeawayH = estimateComparisonTextHeight(takeaway, innerW - 24, 16, 12);

    layers.push(
      makeComparisonTakeawayBackgroundLayer(innerX, cursorY, innerW, takeawayH, groupPatch),
      makeComparisonTextLayer({
        text: takeaway,
        x: innerX,
        y: cursorY,
        w: innerW,
        h: takeawayH,
        fontSize: 16,
        padding: 12,
        weight: 800,
        color: "#bfdbfe",
        comparisonRole: "takeaway",
        ...groupPatch,
      })
    );
    cursorY += takeawayH + 8;
  }

  if (markerStyle === "marks") {
    const leftImage = layers.find((layer) => layer.comparisonRole === "leftImage");
    const rightImage = layers.find((layer) => layer.comparisonRole === "rightImage");

    layers.push(
      makeComparisonMarkLayer("✓", innerX + 8, leftImage.y - 6, "#16a34a", "leftMark", 42, groupPatch),
      makeComparisonMarkLayer("✕", innerX + 8, rightImage.y - 6, "#dc2626", "rightMark", 42, groupPatch)
    );
  }

  return [
    {
      ...makeShapeLayer("rectangle", x, y),
      x,
      y,
      w: panelW,
      h: cursorY + 16 - y,
      fillColor: panelColor,
      fillOpacity: 0.94,
      strokeColor: panelColor,
      strokeOpacity: 0,
      strokeWidth: 3,
      name: "Comparison background",
      comparisonRole: "background",
      ...groupPatch,
    },
    ...layers,
  ];
}

function makeComparisonTextLayer({
  text,
  x,
  y,
  w,
  h,
  fontSize,
  weight = 500,
  color,
  align = "left",
  ...groupPatch
}) {
  return {
    id: uid(),
    kind: "text",
    visible: true,
    color,
    x,
    y,
    w,
    h,
    fontSize,
    weight,
    italic: false,
    underline: false,
    strikethrough: false,
    align,
    markdown: false,
    autoFlow: false,
    zoneId: null,
    text,
    ...groupPatch,
  };
}

function makeComparisonLabelBackgroundLayer(x, y, w, fillColor, comparisonRole, groupPatch, layoutScale = 1) {
  return {
    ...makeShapeLayer("rectangle", x, y),
    x,
    y,
    w,
    h: Math.round(44 * layoutScale),
    fillColor,
    fillOpacity: 1,
    strokeColor: fillColor,
    strokeOpacity: 0,
    strokeWidth: 1,
    name: "Comparison label background",
    comparisonRole,
    internalComparisonShape: true,
    ...groupPatch,
  };
}

function makeComparisonMarkLayer(text, x, y, color, comparisonRole, fontSize, groupPatch) {
  return makeComparisonTextLayer({
    text,
    x,
    y,
    w: fontSize,
    h: fontSize,
    fontSize,
    weight: 1000,
    color,
    comparisonRole,
    ...groupPatch,
  });
}

function makeComparisonTakeawayBackgroundLayer(x, y, w, h, groupPatch) {
  return {
    ...makeShapeLayer("rectangle", x, y),
    x,
    y,
    w,
    h,
    fillColor: "#020617",
    fillOpacity: 0.28,
    strokeColor: "#020617",
    strokeOpacity: 0,
    strokeWidth: 1,
    name: "Comparison takeaway background",
    comparisonRole: "takeawayBackground",
    internalComparisonShape: true,
    ...groupPatch,
  };
}

function makeComparisonHeadingBackgroundLayer(x, y, w, h, groupPatch) {
  return {
    ...makeShapeLayer("rectangle", x, y),
    x,
    y,
    w,
    h,
    fillColor: "#020617",
    fillOpacity: 0.28,
    strokeColor: "#020617",
    strokeOpacity: 0,
    strokeWidth: 1,
    name: "Comparison heading background",
    comparisonRole: "headingBackground",
    internalComparisonShape: true,
    ...groupPatch,
  };
}

function estimateComparisonTextHeight(text, width, fontSize, padding = 0) {
  const charsPerLine = Math.max(1, Math.floor(width / Math.max(1, fontSize * 0.58)));
  const lines = String(text || "")
    .split("\n")
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);

  return Math.max(40, Math.ceil(lines * fontSize * 1.25 + padding * 2));
}

function mixHex(baseHex, mixHexValue, amount) {
  const base = parseHex(baseHex);
  const mix = parseHex(mixHexValue);
  const ratio = Math.max(0, Math.min(1, amount));

  return `#${[0, 1, 2]
    .map((index) =>
      Math.round(base[index] * (1 - ratio) + mix[index] * ratio)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function parseHex(value) {
  const normalized = String(value || "#334155").replace("#", "");
  const hex = normalized.length === 6 ? normalized : "334155";

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

export function makeDefaultBackgroundRectLayer(title = "VOD FEEDBACK", templateStyle = "", backgroundColor = "#75819a") {
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
    fillColor: backgroundColor,
    fillOpacity: 1,
    strokeColor: backgroundColor,
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
    underline: false,
    strikethrough: false,
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
    underline: false,
    strikethrough: false,
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
