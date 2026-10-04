# Agent instructions

This repository is **posterskill**: a skill that turns a paper into a print-ready, self-contained HTML conference poster.

## Making or revising a poster

When asked to create, revise, or finalize a poster, read and follow
[`.agents/skills/make-poster/SKILL.md`](.agents/skills/make-poster/SKILL.md).
That file is the single source of truth. Start from the template at
`.agents/skills/make-poster/assets/template.html`.

## Repository conventions

- Paper source goes in `overleaf/`, reference posters in `references/` (both gitignored).
- Generated output goes in `poster/` (`poster/index.html` + assets).
- Never commit `overleaf/` or `references/` contents — papers may be under anonymous review.
- `main` holds only the generic tool. Each poster lives on its own branch created from `main`;
  generic improvements to the skill or template belong on `main`, not on poster branches.
