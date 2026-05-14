import { getShapeLabel } from "./shapeRenderer.js";

export function estimateTextHeight(text, width, fontSize) {
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(8, Math.floor(width / avgCharWidth));
  const lineCount = String(text || "")
    .split("\n")
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);

  return Math.max(fontSize * 2.2, lineCount * fontSize * 1.45);
}

export function getLayerListLabel(layer) {
  if (layer.name?.trim()) {
    const prefix = layer.kind === "image"
      ? "IMG"
      : layer.kind === "emoji"
        ? "EMOJI"
        : layer.kind === "shape"
          ? "S"
          : "T";

    return `${prefix} ${layer.name.trim()}`;
  }

  if (layer.kind === "text") {
    const cleanText = (layer.text || "")
      .replace(/\s+/g, " ")
      .trim();

    const firstWords = cleanText
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");

    return `T ${firstWords || "Text"}`;
  }

  if (layer.kind === "image") {
    return `IMG ${layer.name || "Image"}`;
  }

  if (layer.kind === "emoji") {
    return `EMOJI ${layer.name || "Emoji"}`;
  }

  if (layer.kind === "shape") {
    return `S ${getShapeLabel(layer.shapeType)}`;
  }

  return layer.kind;
}
