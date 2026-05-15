const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const templatesDir = path.join(__dirname, "..", "public", "templates");
const targetWidth = 1080;
const targetHeight = 1527;
const allowedExtensions = new Set([".png"]);

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
  const tempPath = `${filePath}.optimized.png`;
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
      "-compression_level",
      "100",
      tempPath,
    ],
    { stdio: "inherit" }
  );

  if (result.status !== 0) {
    fs.rmSync(tempPath, { force: true });
    throw new Error(`ffmpeg failed for ${filePath}`);
  }

  fs.renameSync(tempPath, filePath);
}

const files = walk(templatesDir);
const before = files.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);

for (const filePath of files) {
  optimize(filePath);
}

const after = files.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);

console.log(`Optimized ${files.length} templates.`);
console.log(`Before: ${before} bytes`);
console.log(`After: ${after} bytes`);
