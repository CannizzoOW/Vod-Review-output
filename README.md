# Rivals VOD Review Editor

A browser-based editor for creating clean Marvel Rivals VOD review sheets from coach notes, Discord review text, or imported review JSON.

The project is built with React, Vite, Tailwind CSS, and html-to-image. It is designed to help reviewers turn written feedback into shareable PNG review pages with hero-specific templates, text layers, image layers, safe zones, page titles, and footer metadata.

## Features

- Hero-specific review templates
- Import review JSON
- Paste and parse raw Discord review text
- Automatically split feedback into editable segments
- Click-to-place text segments on the canvas
- Auto-place all unused segments across pages
- Add screenshot/image layers with captions
- Move and resize layers on the canvas
- Edit layer position, size, text, weight, and style from the properties panel
- Safe zones for main text, screenshots, and footer placement
- Inline page renaming
- Automatic page title layer
- Footer layer using player, coach, and replay ID metadata
- Multi-page review support
- Save and load local drafts
- Export the active page as a PNG

## Tech stack

- React
- Vite
- Tailwind CSS
- Framer Motion
- html-to-image
- react-markdown
- remark-gfm
- lucide-react

## Getting started

### Requirements

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Basic workflow

1. Choose a hero template.
2. Fill in player, coach, and replay ID.
3. Import review JSON or paste raw Discord review text.
4. Parse the review into segments.
5. Place segments manually or use auto-place all.
6. Adjust text, safe zones, screenshots, and page titles.
7. Export the final page as PNG.

## Review JSON support

The editor can import JSON files containing review metadata, segments, pages, and safe zones.

Supported metadata fields include values such as:

- `player`
- `username`
- `hero`
- `heroes`
- `reviewer`
- `replayId`
- `replayID`
- `replay_id`

If `segments`, `pages`, or `safeZones` are present, the editor will try to load them into the workspace.

## Page and layer system

Each review can contain multiple pages. Pages can be renamed inline from the page tabs. The page title is also mirrored onto the canvas as a locked text layer.

Layer types currently include:

- Text layers
- Image layers
- Footer metadata layer
- Page title layer

## Safe zones

Safe zones help keep content aligned to the template.

Default safe zones:

- Main text
- Screenshots
- Footer

Safe zones can be selected from the right panel and edited through the properties panel.

## Exporting

The active page can be exported as a PNG using the Export PNG button. The export hides editor-only UI such as selection rings, safe zone outlines, and non-export helpers.

## Planned improvements

- New review setup wizard
- More layout presets
- Better screenshot placement tools
- More template customization
- Improved import/export format
- Batch export for multi-page reviews

## Disclaimer

This is a community-made tool and is not affiliated with Marvel Rivals, NetEase, or any official Marvel Rivals service.