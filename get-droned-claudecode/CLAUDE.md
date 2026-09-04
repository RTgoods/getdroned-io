# Claude Code project guide

## Objective

Maintain and extend the Get Droned browser game without breaking desktop, iPhone, or touch controls.

## Entry points

- `index.html` — interface markup and level/boss menu buttons
- `assets/css/game.css` — responsive interface styling
- `assets/js/game.js` — gameplay, rendering, levels, bosses, controls, audio, and state
- `assets/images/` — all external image assets

## Project rules

1. Keep the project static and directly hostable unless a backend is intentionally added.
2. Keep image assets external; do not turn them back into Base64 data URLs.
3. Preserve mouse, keyboard, pointer, and iPhone touch support.
4. Keep each level-opening cover connected to its matching level.
5. Validate `assets/js/game.js` after edits.
6. Avoid renaming image files without updating every reference.
7. Test from a local HTTP server when browser security rules block local-file behavior.

## Current cover behavior

Selecting any main level hides the menu, displays its cover for six seconds, and then starts the level. The user can bypass the wait with `START NOW`.

## Deployment

The project has no build step. `index.html` is the deployment entry point. It can be deployed as a static project on Vercel or GitHub Pages.

