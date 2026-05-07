const fs = require("fs");
const path = require("path");

const templatesDir = path.join(__dirname, "..", "public", "templates");
const outputDir = path.join(__dirname, "..", "src", "data");
const outputFile = path.join(outputDir, "heroTemplates.json");

const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];

const nameOverrides = {
    "cloak-and-dagger": "Cloak & Dagger",
    "jeff-the-land-shark": "Jeff the Land Shark",
    "rocket-raccoon": "Rocket Raccoon",
    "doctor-strange": "Doctor Strange",
    "peni-parker": "Peni Parker",
    "spider-man": "Spider-Man",
    "the-punisher": "The Punisher",
    "invisible-woman": "Invisible Woman",
};

function cleanSlug(filename) {
    const ext = path.extname(filename);

    return path
        .basename(filename, ext)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "");
}

function heroNameFromSlug(slug) {
    if (nameOverrides[slug]) {
        return nameOverrides[slug];
    }

    return slug
        .split("-")
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

if (!fs.existsSync(templatesDir)) {
    console.error(`Templates folder missing: ${templatesDir}`);
    process.exit(1);
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs
    .readdirSync(templatesDir)
    .filter((file) => {
        return allowedExtensions.includes(
            path.extname(file).toLowerCase()
        );
    })
    .sort();

const heroTemplates = {};

for (const file of files) {
    const slug = cleanSlug(file);
    const heroName = heroNameFromSlug(slug);

    heroTemplates[heroName] = {
        slug,
        template: `/templates/${file}`,
    };
}

fs.writeFileSync(
    outputFile,
    JSON.stringify(heroTemplates, null, 2),
    "utf8"
);

console.log(`Generated heroTemplates.json`);
console.log(`Found ${files.length} templates.`);