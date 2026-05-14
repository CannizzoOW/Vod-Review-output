const fs = require("fs");
const path = require("path");

const templatesDir = path.join(__dirname, "..", "public", "templates");
const outputDir = path.join(__dirname, "..", "src", "data");
const outputFile = path.join(outputDir, "heroTemplates.json");

const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
const preferredDefaultStyles = {
    "Invisible Woman": "default-v2-page-1",
};

const nameOverrides = {
    "cloak-and-dagger": "Cloak & Dagger",
    "cloak-dagger": "Cloak & Dagger",
    "cloak dagger": "Cloak & Dagger",
    "cnd": "Cloak & Dagger",
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

function styleLabelFromSlug(slug) {
    if (slug === "default") {
        return "Default";
    }

    return slug
        .split("-")
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

function toTemplatePath(...parts) {
    return ["templates", ...parts].join("/");
}

function addHeroStyle(heroTemplates, heroName, heroSlug, styleSlug, styleLabel, templatePath) {
    if (!heroTemplates[heroName]) {
        heroTemplates[heroName] = {
            slug: heroSlug,
            template: templatePath,
            defaultStyle: styleSlug,
            styles: {},
        };
    }

    heroTemplates[heroName].styles[styleSlug] = {
        label: styleLabel,
        template: templatePath,
    };

    if (styleSlug === "default") {
        heroTemplates[heroName].defaultStyle = "default";
        heroTemplates[heroName].template = templatePath;
    }
}

function applyPreferredDefaultStyles(heroTemplates) {
    for (const [heroName, preferredStyle] of Object.entries(preferredDefaultStyles)) {
        const hero = heroTemplates[heroName];
        const style = hero?.styles?.[preferredStyle];

        if (!style) continue;

        hero.defaultStyle = preferredStyle;
        hero.template = style.template;
    }
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

const entries = fs
    .readdirSync(templatesDir)
    .sort();

const heroTemplates = {};
let templateCount = 0;

for (const entry of entries) {
    const entryPath = path.join(templatesDir, entry);
    const stat = fs.statSync(entryPath);

    if (stat.isDirectory()) {
        const heroSlug = cleanSlug(entry);
        const heroName = heroNameFromSlug(heroSlug);
        const styleFiles = fs
            .readdirSync(entryPath)
            .filter((file) => {
                return allowedExtensions.includes(
                    path.extname(file).toLowerCase()
                );
            })
            .sort((a, b) => {
                const aSlug = cleanSlug(a);
                const bSlug = cleanSlug(b);

                if (aSlug === "default") return -1;
                if (bSlug === "default") return 1;

                return a.localeCompare(b);
            });

        for (const file of styleFiles) {
            const styleSlug = cleanSlug(file);
            const styleLabel = styleLabelFromSlug(styleSlug);
            const templatePath = toTemplatePath(entry, file);

            addHeroStyle(
                heroTemplates,
                heroName,
                heroSlug,
                styleSlug,
                styleLabel,
                templatePath
            );
            templateCount += 1;
        }

        continue;
    }

    if (!allowedExtensions.includes(path.extname(entry).toLowerCase())) {
        continue;
    }

    const slug = cleanSlug(entry);
    const heroName = heroNameFromSlug(slug);

    addHeroStyle(
        heroTemplates,
        heroName,
        slug,
        "default",
        "Default",
        toTemplatePath(entry)
    );
    templateCount += 1;
}

applyPreferredDefaultStyles(heroTemplates);

fs.writeFileSync(
    outputFile,
    JSON.stringify(heroTemplates, null, 2),
    "utf8"
);

console.log(`Generated heroTemplates.json`);
console.log(`Found ${templateCount} templates.`);
