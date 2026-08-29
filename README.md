# SR University — Campus Companion

A 4-page site: **Home**, **Campus Tour**, **3D Locator**, and an **offline rule-based chatbot** — no AI API used anywhere. Pure HTML/CSS/JS, so it runs from any static host (or straight from your laptop).

## Run it locally

Just open `index.html` in a browser — or, for the smoothest experience (some browsers restrict local scripts), serve the folder:

```bash
# Python
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to Vercel

This is a plain static site — no build step, no framework — so Vercel needs almost no configuration. `vercel.json` is already set up for clean URLs (`/tour` instead of `/tour.html`) and basic asset caching.

**Option A — Vercel CLI (fastest):**
```bash
npm install -g vercel   # skip if you already have it
cd sru-campus
vercel                  # follow the prompts, accept the defaults
vercel --prod           # promote to your production URL
```

**Option B — GitHub + Vercel dashboard:**
```bash
cd sru-campus
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```
Then on [vercel.com](https://vercel.com): **New Project → Import** your GitHub repo → leave Framework Preset as **Other** → Deploy. No environment variables or build command are needed.

**Option C — drag and drop:** on the Vercel dashboard, "Add New Project" → drag the whole `sru-campus` folder into the import screen.

This zip already includes an initialized git repo (`.git`) with one commit, so Option B works immediately after you point `origin` at your own GitHub repo.

## Files

| File | What it does |
|---|---|
| `assets/data.js` | **Single source of truth.** University info, contact numbers, schools, facilities, all 13 campus buildings, and the chatbot's knowledge base live here. |
| `assets/style.css` | The whole design system (colors, type, layout). |
| `assets/icons.js` | Small inline SVG icon set used on Tour and Locator cards. |
| `assets/nav.js` | Builds the header/footer on every page from `data.js`, so contact info only needs updating in one place. |
| `assets/locator.js` | The 3D campus model (Three.js) — building blocks, click-to-inspect, drag-to-rotate. |
| `assets/chatbot.js` | The keyword-matching chatbot engine. |
| `index.html` / `tour.html` / `locator.html` / `chatbot.html` | The four pages. |

## Making it accurate for your real campus

The data here is pulled from public SR University sources (address, phone numbers, schools, accreditation, placement stats), but a few things are **placeholders you should replace**:

1. **Building positions** (`grid: {x, z}` in `assets/data.js`) are a stylised layout, not the real site plan. Walk the campus (or use the real map) and update the `x`/`z` values, plus `size` (width/height/depth), so the 3D model matches reality.
2. **Building list** — add/remove entries in the `buildings` array in `data.js` for anything specific to your campus (a new block, a named auditorium, etc.). Each one automatically appears on both the Tour page and the 3D Locator.
3. **Chatbot knowledge base** — add more entries to `chatbotIntents` in `data.js` for questions students actually ask. Each intent just needs `keywords` (words/phrases to match) and one or more `responses`.
4. **Phone numbers, email, address** — all pulled from `SRU_DATA.university` — double check these are current before publishing.
5. **Photos** — the site currently uses drawn line icons instead of photos (to avoid using copyrighted campus photography without permission). If you have your own photos, drop `<img>` tags into `tour.html`'s building cards pointing at an `assets/images/` folder you create.

## How the chatbot works (no AI API)

`assets/chatbot.js` lowercases whatever you type, checks it against keyword lists in `SRU_DATA.chatbotIntents`, and returns the canned response for whichever intent scores highest. If nothing matches well enough, it falls back to a "try asking about…" message. Everything runs in the browser — there's no server call, no API key, and no cost.

## How the 3D locator works

`assets/locator.js` uses Three.js (loaded from a CDN) to draw each building as a colored box positioned from `data.js`. Dragging rotates the camera, scrolling zooms, and clicking a box (or a name in the side list) raycasts to find which building you picked and shows its info panel.
