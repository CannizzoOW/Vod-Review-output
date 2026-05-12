import { uid } from "./parsing.js";

export function makeTextLayer(segment, x = 80, y = 380) {
  return {
    id: uid(),
    kind: "text",
    sourceSegmentId: segment.id,
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
        : `${segment.timestamp ? `${segment.timestamp} — ` : ""}${segment.text}`,
  };
}

export function makeImageLayer(src, x = 700, y = 420) {
  return {
    id: uid(),
    kind: "image",
    x,
    y,
    w: 330,
    h: 230,
    src,
    caption: "Screenshot note",
  };
}

export function makeFooterLayer(form) {
  return {
    id: "footer-info",
    kind: "text",
    color: "#e7e6e6",
    x: 0,
    y: 1475,
    w: 1080,
    h: 40,
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

export function makePageTitleLayer(title) {
  return {
    id: "page-title",
    kind: "text",
    color: "#e7e6e6",
    x: 415,
    y: 394,
    w: 614,
    h: 66,
    fontSize: 30,
    weight: 900,
    italic: false,
    markdown: false,
    autoFlow: false,
    zoneId: null,
    locked: true,
    text: title || "VOD FEEDBACK",
  };
}
