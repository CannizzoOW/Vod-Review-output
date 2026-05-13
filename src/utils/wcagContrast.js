function normalizeHex(hex) {
  const clean = String(hex || "").replace("#", "").trim();

  if (clean.length === 3) {
    return clean
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return clean.padEnd(6, "0").slice(0, 6);
}

function hexToRgb(hex) {
  const clean = normalizeHex(hex);
  const value = Number.parseInt(clean, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function channelToLinear(value) {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);

  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function getContrastRatio(foreground, background) {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getWcagStatus(foreground, background) {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio,
    aaLarge: ratio >= 3,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
  };
}
