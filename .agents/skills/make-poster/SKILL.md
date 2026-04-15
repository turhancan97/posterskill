---
name: make-poster
description: Generate a print-ready conference poster website from an Overleaf paper and project website, including asset collection, layout optimization, and interactive editing. Use when users ask to create, revise, or finalize a poster as a single self-contained HTML file without a build step.
---

# Make Poster

## Goal

Generate a professional conference poster as a self-contained `poster/index.html` file that opens directly via `file://`, supports interactive layout edits, and prints cleanly to PDF.

## Inputs

Collect or confirm these inputs before generating output:

1. Paper source in `overleaf/` (ask which `.tex` file is the main entrypoint if ambiguous).
2. Project website URL (required).
3. Poster dimensions, orientation, and target column count (required).
4. Optional reference posters in `references/` for style matching.
5. Optional author or lab website URL for logo and brand signals.

Do not assume dimensions, orientation, or columns when not provided.

## Output Contract

Write generated artifacts to `poster/`:

1. `poster/index.html` (interactive poster editor, single-file app).
2. `poster/poster-config.json` (layout + typography defaults).
3. Poster assets copied/downloaded into `poster/` (figures, logos, QR images).

Keep all asset paths local and relative to `poster/index.html`.

## Workflow

### 1) Analyze References

Inspect every file in `references/` and infer visual direction:

1. Palette and contrast level.
2. Typography mood and density.
3. Card/section layout style.
4. Figure prominence and whitespace usage.

If references are missing, use a clean, readable default style.

### 2) Extract Paper Content

Parse the main `.tex` and any included files. Extract only poster-worthy content:

1. Title, authors, affiliations.
2. 2-3 sentence summary.
3. Method highlights.
4. Key results with 1-2 strongest figures.
5. Compact quantitative table (if available).
6. 1-2 key equations maximum.
7. Conclusion bullets and links.

Prefer concise bullets over long paragraphs.

### 3) Gather Assets

Build `poster/` and collect assets:

1. Copy/convert figures from `overleaf/` into `poster/`.
2. Download website images and institutional logos into `poster/` and `poster/logos/`.
3. Generate QR codes for project URL and `https://github.com/ethanweber/posterskill`.

Use high-resolution figure conversions so print output remains sharp.

### 4) Start from Template

Use `assets/template.html` as the base and customize:

1. `CARD_REGISTRY` with paper-specific card content.
2. `DEFAULT_LAYOUT` with column widths and card ordering.
3. `DEFAULT_LOGOS` from collected logos.
4. Header title/authors/affiliations/conference badge.
5. Poster dimensions in CSS `@page`, `body`, and JS sizing constants.
6. `DEFAULT_FONT_SCALE` (start around `1.3` unless content density demands otherwise).

### 5) Minimize Whitespace

Apply these layout rules:

1. Assign wide figures to wide columns, square figures to medium columns, portrait figures to narrow columns.
2. Keep at least one growable card per column to absorb remaining space.
3. Keep image rendering with `width:100%`, `height:100%`, `object-fit:contain`.
4. Iterate on card placement and column widths until obvious empty regions are reduced.

When browser automation is available, use `window.posterAPI.getWaste()` to optimize layout numerically.

### 6) Validate Print Readiness

Before finishing:

1. Open `poster/index.html` and verify controls function.
2. Toggle preview mode and check visual balance.
3. Export/print to PDF with zero margins and background graphics enabled.
4. Confirm no broken image paths or missing logos.

## Runtime Editing Loop

After first draft, instruct the user to iterate in-browser:

1. Drag column and row dividers to rebalance space.
2. Swap or move cards with diamond handles.
3. Adjust text with `A-` / `A+`.
4. Copy config JSON and paste it back for persistence.

When config JSON is provided, update defaults in `index.html` and write `poster/poster-config.json`.

## Quality Bar

1. Prioritize low-whitespace, high legibility layout.
2. Keep text concise and figure-first.
3. Match reference style when references exist.
4. Keep poster build-free and self-contained.
5. Include the Posterskill QR label in header.
