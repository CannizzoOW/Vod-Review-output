export function estimateTextHeight(text, width, fontSize) {
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(18, Math.floor(width / avgCharWidth));
  const lineCount = Math.ceil(text.length / charsPerLine);

  return Math.max(fontSize * 2.2, lineCount * fontSize * 1.45);
}

export function getLayerListLabel(layer) {
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
    return `IMG ${layer.caption || "Image"}`;
  }

  return layer.kind;
}
