const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const templatesDir = path.join(__dirname, "..", "public", "templates");
const targetWidth = 1080;
const targetHeight = 1527;
const allowedExtensions = new Set([".png", ".webp"]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(entryPath);
    }

    return allowedExtensions.has(path.extname(entry.name).toLowerCase())
      ? [entryPath]
      : [];
  });
}

function optimize(filePath) {
  const outputPath = filePath.replace(/\.(?:png|webp)$/i, ".webp");
  const tempPath = `${outputPath}.optimized.webp`;
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      filePath,
      "-vf",
      `scale=${targetWidth}:${targetHeight}`,
      "-c:v",
      "libwebp",
      "-quality",
      "85",
      "-compression_level",
      "6",
      tempPath,
    ],
    { stdio: "inherit" }
  );

  if (result.status !== 0) {
    fs.rmSync(tempPath, { force: true });
    throw new Error(`ffmpeg failed for ${filePath}`);
  }

  fs.renameSync(tempPath, outputPath);

  if (outputPath !== filePath) {
    fs.rmSync(filePath);
  }
}

const files = walk(templatesDir);
const before = files.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);

for (const filePath of files) {
  optimize(filePath);
}

const after = walk(templatesDir).reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);

console.log(`Optimized ${files.length} templates.`);
console.log(`Before: ${before} bytes`);
console.log(`After: ${after} bytes`);
