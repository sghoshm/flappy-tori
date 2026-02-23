# Flappy Tori

A Flappy Bird–style browser game built with **React + TypeScript + Vite**, featuring a responsive playable area, difficulty selection, persistent high score, and a local top‑3 leaderboard.

Repo: `https://github.com/sghoshm/flappy-tori`

## Features

- **Responsive playable area**: the game canvas automatically fits the available screen size (desktop + mobile).
- **3 difficulties**: Easy / Medium / Hard adjust pipe speed and gap size.
- **Controls**: click / tap the canvas or press **Space** to flap.
- **High score**: saved to `localStorage`.
- **Local leaderboard (top 3)**: saved to `localStorage` and updated on game over.
- **Custom bird sprite + favicon**: stored in `public/`.

## Quick start

### Prerequisites

- Node.js + npm

### Run locally

```bash
npm install
npm run dev
```

Open the dev server URL (usually `http://localhost:5173`).

### Build & preview production

```bash
npm run build
npm run preview
```

## How to play

1. Enter your name.
2. Choose a difficulty.
3. Flap with **click/tap** or **Space**.
4. Pass through pipe gaps to score points.

## Data persistence

- **High score**: `localStorage` key `flappyBirdHighScore`
- **Leaderboard** (top 3 runs): `localStorage` key `flappyBirdLeaderboard`

## Project structure

```text
public/
  bird.png        # Bird sprite
  favicon.png     # Favicon
src/
  App.tsx         # UI + game loop + leaderboard persistence
  gameLogic.ts    # Physics, pipes, collision, scoring, difficulty config
  App.css         # Layout + styling (3-column desktop grid)
  main.tsx        # React entrypoint
index.html        # Page title + favicon
```

## Scripts

- `npm run dev`: start dev server
- `npm run build`: typecheck + production build
- `npm run preview`: preview production build
- `npm run lint`: lint

## License

Apache-2.0 (see `LICENSE`).
