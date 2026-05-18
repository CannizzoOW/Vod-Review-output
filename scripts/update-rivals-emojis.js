import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import path from "node:path";

const SOURCE_URL = "https://rivalskins.com/?type=emoji";
const OUTPUT_PATH = "src/utils/rivalsEmojis.js";
const EMOJI_OUTPUT_DIR = "public/emojis";

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#038;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function parseEmojiCards(html) {
  const cardPattern =
    /<a href="(?<href>[^"]+)"\s+class="item-card[^"]*"\s+data-id="(?<id>\d+)"\s+data-type="emoji">(?<body>.*?)<\/a>/gs;
  const emojis = [];

  for (const match of html.matchAll(cardPattern)) {
    const body = match.groups.body;
    const nameMatch = body.match(
      /<div class="tooltip tooltip-top">(?<name>.*?)<\/div>/s
    );
    const imageMatch = body.match(/<img src="(?<src>[^"]+)" alt=/s);

    if (!nameMatch?.groups?.name || !imageMatch?.groups?.src) continue;

    emojis.push({
      id: match.groups.id,
      name: decodeHtml(stripTags(nameMatch.groups.name)),
      src: imageMatch.groups.src,
      href: match.groups.href,
    });
  }

  return emojis;
}

function getEmojiFilename(emoji) {
  const sourceFilename = path.basename(new URL(emoji.remoteSrc).pathname);
  return `${emoji.id}-${sourceFilename}`.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function fileExists(filePath) {
  try {
    const existing = await readFile(filePath);
    return existing.length > 0;
  } catch {
    return false;
  }
}

async function downloadEmojiImage(emoji) {
  const filename = getEmojiFilename(emoji);
  const outputPath = path.join(EMOJI_OUTPUT_DIR, filename);

  if (await fileExists(outputPath)) {
    return `emojis/${filename}`;
  }

  const response = await fetch(emoji.remoteSrc);

  if (!response.ok) {
    throw new Error(`Could not fetch emoji image ${emoji.remoteSrc}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);

  return `emojis/${filename}`;
}

function toModule(emojis) {
  return `export const RIVALS_EMOJI_SOURCE = ${JSON.stringify(SOURCE_URL)};\n\nexport const RIVALS_EMOJIS = ${JSON.stringify(emojis, null, 2)};\n`;
}

const response = await fetch(SOURCE_URL);

if (!response.ok) {
  throw new Error(`Could not fetch Rivals emojis: ${response.status}`);
}

const html = await response.text();
const emojis = parseEmojiCards(html);

if (!emojis.length) {
  throw new Error("No Rivals emoji cards found.");
}

await mkdir(EMOJI_OUTPUT_DIR, { recursive: true });

const localEmojis = [];

for (const emoji of emojis) {
  const remoteSrc = emoji.src;
  const localSrc = await downloadEmojiImage({ ...emoji, remoteSrc });

  localEmojis.push({
    ...emoji,
    src: localSrc,
    remoteSrc,
  });
}

await writeFile(OUTPUT_PATH, toModule(localEmojis), "utf8");
console.log(`Updated ${OUTPUT_PATH} with ${localEmojis.length} Rivals emojis.`);
