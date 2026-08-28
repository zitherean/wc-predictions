# World Cup 2026 Predictions Game

A static World Cup predictions website. The browser loads its read-only match, profile, prediction, and leaderboard snapshots from `public/data/` and stores the current session, new local accounts, and local predictions in the browser's `localStorage`.

## Run locally

Serve the repository with any static web server so browser modules can fetch JSON files:

```text
npx serve public
```

Then open the URL printed by the server. Opening the HTML files directly from disk will block JSON requests in some browsers.

## Data

The JSON files in `data/` are deployment data and are served at `/data/*.json` through the Vercel `public` directory. Copy or update them before deploying to publish a new snapshot. The browser cannot write to these files, so local account and prediction changes are private to the current browser.

## Project structure

- `public/`: static HTML, CSS, JavaScript, and JSON data
- `public/js/data.js`: JSON loading and local storage helpers
- `public/js/auth.js`: local browser session and account handling
- `public/js/matches.js`: match rendering and local predictions
- `public/js/leaderboard.js`: leaderboard rendering
- `vercel.json`: static-page rewrites

## Deploy

Deploy the project with any static hosting provider. For Vercel, run:

```text
npm install
npm run deploy
```
