# Avocado Pomodoro

A tiny always-on-top pixel-art pomodoro timer for the desktop, built with Electron. The countdown lives inside the pit of a cute avocado (or an orange, a cat, a planet...).

## Features

- Frameless, transparent, draggable window that stays on top (toggle with `^`)
- Focus / Break / Long Break modes, with a long break after every 4th focus session
- Click the big number and type the minutes (1-120), or use `+` / `-` / mouse wheel
- 10 pixel skins: Avocado, Orange, Strawberry, Watermelon, Tabby Cat, Black Cat, Earth, Mars, Moon, Saturn
- Resizable: drag the corner grip (double-click to reset)
- Task label, chiptune jingle, desktop notification and taskbar flash when a session ends
- Remembers your skin, size, durations and task

## Run it

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm start
```

## Shortcuts

| Key | Action |
| --- | --- |
| Space | Start / pause |
| R | Reset |
| Left / Right | Previous / next skin |
| Enter (in task field) | Start |

## Project layout

- `main.js` - Electron main process (window, resize, always-on-top)
- `preload.js` - safe bridge between the window and the page
- `renderer/skins.js` - procedural pixel-art skins (add a new one by adding an entry to `SKINS`)
- `renderer/app.js` - timer logic and UI wiring
