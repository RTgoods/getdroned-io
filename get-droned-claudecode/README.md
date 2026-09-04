# Get Droned

Organized browser-game source prepared for continued work in Claude Code.

## Run locally

The simplest option is to open `index.html` in a modern browser.

For a local web server, run this command from the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

You can also run:

```bash
npm start
```

## Project structure

```text
get-droned-claudecode/
├── index.html
├── package.json
├── README.md
├── assets/
│   ├── css/game.css
│   ├── js/game.js
│   ├── audio/README.md
│   └── images/
│       ├── covers/
│       ├── bosses/
│       ├── emblems/
│       └── ui/
└── docs/PROJECT_NOTES.md
```

## Important implementation notes

- `assets/js/game.js` contains the game engine, level logic, drawing code, controls, synthesized sound effects, and boss logic.
- `assets/css/game.css` contains the complete interface and responsive layout.
- The six level-opening covers are separate WebP files at their original `1672 × 941` dimensions.
- Every level cover pauses gameplay for six seconds and includes a `START NOW` button.
- Sound effects are currently generated through the Web Audio API, so there are no required audio files.
- Image paths are relative to `index.html`, making the folder suitable for GitHub, Vercel, or another static host.

## Main editing locations

- Menu and interface markup: `index.html`
- Gameplay and level behavior: `assets/js/game.js`
- Visual styling: `assets/css/game.css`
- Level-opening artwork: `assets/images/covers/`

