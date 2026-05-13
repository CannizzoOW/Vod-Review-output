function uid() {
  return crypto.randomUUID();
}

export function extractTimestamp(text) {
  const match = text.match(/\b(?:around\s*)?(\d{1,2}:\d{2})\b/i);
  return match ? match[1] : "";
}

export function removeLeadingTimestamp(text) {
  return text
    .replace(/^(?:around\s*)?\d{1,2}:\d{2}\s*(?:[-–—:|]\s*)?/i, "")
    .trim();
}

export function parseDiscordReview(raw) {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const segments = [];
  let section = "General";
  let replayId = "";
  let paragraph = [];

  function flush() {
    if (!paragraph.length) return;

    const text = paragraph.join(" ");
    const timestamp = extractTimestamp(text);

    segments.push({
      id: uid(),
      type: "paragraph",
      title: section,
      section,
      timestamp,
      text: timestamp ? removeLeadingTimestamp(text) : text,
      used: false,
    });

    paragraph = [];
  }

  for (const line of lines) {
    const replay = line.match(/Replay ID:\s*(\d+)/i);

    if (replay) {
      replayId = replay[1];
      continue;
    }

    const clean = line.replace(/^[-•*]\s*/, "").trim();
    const isBullet = /^[-•*]\s*/.test(line);
    const hasTime = extractTimestamp(line);

    const isHeading =
      clean.length <= 35 &&
      !/[.!?]$/.test(clean) &&
      !hasTime &&
      !clean.includes(":");

    if (isHeading) {
      flush();
      section = clean;

      segments.push({
        id: uid(),
        type: "heading",
        title: clean,
        section,
        timestamp: "",
        text: clean,
        used: false,
      });

      continue;
    }

    if (isBullet || hasTime) {
      flush();
      const timestamp = extractTimestamp(clean);

      segments.push({
        id: uid(),
        type: "timestamp_note",
        title: section,
        section,
        timestamp,
        text: timestamp ? removeLeadingTimestamp(clean) : clean,
        used: false,
      });

      continue;
    }

    paragraph.push(line);
  }

  flush();
  return { replayId, segments };
}

export { uid };
