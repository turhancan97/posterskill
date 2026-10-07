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
3. Poster size and orientation (required). Ask the user to confirm with the organizers or print service: many accept either **A0 portrait** or **A1 landscape** (the same √2 aspect, so one landscape design can be exported at both A0 and A1).
4. Optional reference posters in `references/` for style matching.
5. Optional author or lab website URL for logo and brand signals.
6. Event details: ask where the poster will be presented and the event name.
7. If an event name is provided, ask whether the event has a logo and accept `event_logo.png` for inclusion.
8. Optional "about me" box: presenter photo, one-line pitch (e.g. "open to internships"), and a URL for the QR code.

Do not assume size or orientation when they are not provided.

## Output Contract

Write generated artifacts to `poster/`:

1. `poster/index.html` (interactive poster editor, single-file app).
2. `poster/poster-config.json` (layout + typography defaults).
3. Poster assets copied/downloaded into `poster/` (figures, logos, optional photo).
4. Final PDFs (e.g. `poster/poster_A0.pdf`, `poster/poster_A1.pdf`) once the layout is approved.

Keep all asset paths local and relative to `poster/index.html`.

## Templates

| Template | Use when |
|----------|----------|
| `assets/template.html` (default) | Most posters. Story-driven 3-column (landscape) or 2-column (portrait) design with a hook panel, result widgets, optional about-me box with QR, palette variables and print-safe CSS. |
| `assets/template_classic.html` | The original upstream template: plain cards, no hook panel or widgets. Use when the user asks for it or a reference poster calls for a minimal card grid. |

Configuration sections at the top of the default template's `<script>` (edit these, not the framework code below them):

- `POSTER` — `{ size: 'A0', orientation: 'landscape' | 'portrait' }`. Drives `@page`, body size and the default layout. `?orientation=portrait` in the URL overrides it for previews.
- `:root` CSS variables — palette: `--frame-a/b/c` (header and hook gradient), `--accent`, `--hl` (highlight for "ours"), `--base`, `--title-mark`, `--hook-w`. Widgets derive tints with `color-mix`, so changing these recolours everything.
- `TITLE`, `AUTHORS`, `AFFILIATIONS`, `CONTACT`, `DEFAULT_LOGOS`, `EVENT`.
- `BRAND_ICON` — a small geometric glyph used in the hook and title. Replace `BrandGlyph` with the method's own icon, or set `enabled: false`.
- `HOOK` — the left (landscape) or top (portrait) panel: a question, a one-line answer, a subline and three points (each an icon, a number or short text).
- `ABOUT` — optional presenter box: photo, name line, "open to" line, keywords, `url` encoded as a styled QR at runtime (falls back to text if the QR library fails to load).
- Widget data: `CALLOUTS` (big-number callouts), `RANKS` (rows × tasks heatmap, ★ marks best), `SCATTER` / `SCATTER_OPTS` (params vs. rank, arrow from a baseline to ours), `ABLATION` (per-task delta tiles), `KEYWORDS` (setup strip + note line). Each has a comment describing its format.
- `CARD_REGISTRY`, `DEFAULT_LAYOUT` (one per orientation), `DEFAULT_FONT_SCALE`.
- `FigPlaceholder` marks where a real figure goes; replace every one before finishing.

## Workflow

### 1) Analyze References

Inspect every file in `references/` and infer visual direction:

1. Palette and contrast level.
2. Typography mood and density.
3. Card/section layout style.
4. Figure prominence and whitespace usage.

If references are missing, keep the default template's palette and style.

### 2) Extract Paper Content as a Story

Parse the main `.tex` and any included files. Build the poster as a story a passer-by can follow in 30 seconds:

1. **Hook** — one question the paper answers, and the one-line answer.
2. **Problem #1 / Problem #2** — what is wrong or missing today, each with a figure.
3. **Solution** — the method, with its overview figure.
4. **What it learns / analysis** — one insight figure.
5. **Results** — the strongest numbers as callouts, a compact comparison (heatmap, scatter or small table).
6. **Ablation** — one key design choice.
7. **Take-home** — 2–3 takeaways, plus setup keywords (models, benchmarks, seeds).

Use at most 1–2 equations, and only if they are essential.

### 3) Gather Assets

Build `poster/` and collect assets:

1. Copy/convert figures from `overleaf/` into `poster/` at high resolution.
2. Download website images and institutional logos into `poster/` and `poster/logos/`.
3. If provided, copy event logo as `poster/event_logo.png` and the presenter photo for the about-me box.
4. Do not generate `qr-posterskill.png`; the template renders the QR itself from `ABOUT.url`.

### 4) Start from Template

Copy `assets/template.html` to `poster/index.html` and fill the configuration sections listed above. Replace every placeholder (`FigPlaceholder`, `N models`, `Task A`, example numbers) with paper content and delete widgets or cards the paper does not need.

### 5) Design Rules

1. **Graphics ≥ 50%** of the card area. Figures carry the story; text supports them.
2. **Keyword bullets**: short bullets that start with a **bold keyword**; no paragraphs.
3. **One-line captions** (`Fig. N — what to look at`).
4. Put the best figure in the centre column at the largest size.
5. Highlight "ours" with `--hl` consistently across widgets; use colour for meaning, not decoration.
6. Keep at least one growable card per column so whitespace is absorbed. Assign wide figures to wide columns.
7. Use `window.posterAPI.getWaste()` or `scripts/check_layout.js` to tune column widths and card heights numerically.

### 6) Rigour

1. Fact-check every number and claim against the paper source. Re-check after every content edit.
2. Scope claims exactly (which backbones, tasks, seeds, datasets). Do not generalise beyond the evidence.
3. Captions describe only what is visible in the figure.
4. If qualitative examples are hand-picked, say so ("selected examples").

### 7) Verify the PDF, Not the Screen

Chrome's print layout can differ from the screen: `backdrop-filter` can drop whole sections from the PDF, `text-shadow` can print as boxes, and text that fits on screen can clip in print. The template disables these effects under `@media print`, but always check the exported file.

Set up the scripts once (from the repo root):

```bash
cd .agents/skills/make-poster/scripts && npm install && npx playwright install chromium && cd -
```

Then:

```bash
S=.agents/skills/make-poster/scripts
node $S/check_layout.js poster/index.html            # per-card clip/slack (screen + print), graphics share, word count; exits 1 on clipping
node $S/export_pdf.js poster/index.html --out poster/poster_A0.pdf
node $S/export_pdf.js poster/index.html --size A1 --out poster/poster_A1.pdf   # uniform vector downscale of the A0 design
node $S/check_qr.js poster/index.html --expect https://your.site/           # decodes the QR at several sizes
```

Add `--orientation portrait` to check or export the other orientation. Rasterize the PDF and inspect it visually. Confirm it has one page, the right page size, embedded fonts and no broken images (`export_pdf.js` reports all of these).

## Runtime Editing Loop

After the first draft, ask the user to iterate in the browser:

1. Drag column and row dividers to rebalance space.
2. Swap or move cards with diamond handles.
3. Adjust text with `A-` / `A+`.
4. Copy config JSON and paste it back for persistence.

When config JSON is provided, update defaults in `index.html` and write `poster/poster-config.json`. Layouts are saved per page path and orientation, so several posters hosted on one site do not overwrite each other.

## Quality Bar

1. Story first: a reader gets the hook, problem, solution and main result in 30 seconds.
2. Graphics ≥ 50%, low whitespace, legible from 2 m.
3. Every number traceable to the paper; claims scoped to the evidence.
4. No clipping in the exported PDF; QR decodes; no placeholders left.
5. Match reference style when references exist.
6. Keep the poster build-free and self-contained.
