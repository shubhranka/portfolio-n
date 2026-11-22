# Shubhranka Varma — Portfolio

"Calm Software": a dark-first personal site built with Vite, TypeScript and Three.js. It has a home page, five case studies and a `~` terminal.

## Run it

Requires Node.js 20.19+ (22+ recommended).

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ locally
npx lighthouse http://localhost:4173/ --form-factor=mobile --view   # with preview running
```

## Editing content

**All content lives in [`src/data.ts`](src/data.ts):** profile, projects, case studies, toolbox, lab and contact. The pages and the terminal read from it, so you never need to edit HTML.

Placeholders are marked so they're easy to find, and they stay visibly marked on the site until you replace them:

- Text wrapped in `[[…]]` shows as a dashed amber label. Search `src/data.ts` for `[[`.
- Items with `placeholder: true` get a dashed outline (e.g. résumé).
- In dev, the console prints how many placeholders are left on the page.

Still to fill in:

| What | Where |
| --- | --- |
| Photo | Put it in `public/me.jpg` and set `profile.photo = '/me.jpg'` |
| Résumé | Put it in `public/resume.pdf`, then remove `placeholder: true` from `profile.resume` |
| Jourme one-liner | the `jourme` project |
| Ask-me / Sentinel / Chalky screenshots | Add images under `public/work/<slug>/` and set `hero.src` (plus `gallery` if you like) |
| Hackathon details, Chalky role, "What I learned" | the matching `caseStudy` fields |

The case studies are drafted from each repo's README. Chalky's README is the Next.js starter, so its case study is inferred from `package.json` and is flagged for review.

### Demos, games and secrets

Copy and data for the playful parts of the site (demo scripts, glossary, and later the games, badges and stones) live in [`src/extras.ts`](src/extras.ts).

- **Playable demos.** The Sentinel and Ask-me case studies have a "Try it" section (`#demo`). Their home tiles get a small link to it. Tiles are listed in `demoTiles`, the Sentinel numbers and lines are in `sentinelSim`, and the call script and gauge values are in `askMeReplay`. Nothing plays until the visitor presses a button.
- **Highlight to explain.** On any case-study page, selecting a word that's in `glossary` shows a short explanation card next to it. It closes when you click elsewhere, press Esc or use ×. To add a word, add `{ term, also?, text }`. Matching ignores case, surrounding punctuation and a trailing plural "s".

### Adding a case study

1. Add a `caseStudy` to the project in `src/data.ts`. Order in `projects` = order on the site.
2. Create `work/<slug>/index.html` by copying an existing one and changing `data-slug` and `<title>`. Vite picks up every folder in `work/` automatically.

## How it's built

```
index.html               home entry
work/<slug>/index.html   one tiny entry per case study
src/data.ts              ← all content
src/main.ts              home page
src/case.ts              case study page
src/shared.ts            header tools, footer, boot()
src/extras.ts            ← content for demos, games and secrets
src/demos/               Sentinel mini-sim, Ask-me call replay, highlight-to-explain glossary
src/lib/                 theme, terminal, tilt/reveal, formatting, env detection
src/three/stage.ts       shared renderer plumbing (see below)
src/three/hero.ts        noise-displaced fresnel glass blob, orbit rings
src/three/particles.ts   page-wide particle field that parts around the cursor
src/three/tagSphere.ts   draggable 3D skill sphere
src/three/wave.ts        wireframe wave plane that ripples under the cursor
```

Everything about the 3D scenes is set up to stay calm and cheap:

- **Loaded after first paint.** three.js is a separate chunk, imported when the browser is idle.
- **Paused when unseen.** Each scene's render loop stops when it scrolls offscreen or the tab is hidden.
- **Lighter on phones.** Phones get a capped pixel ratio, fewer vertices and particles, and no antialiasing.
- **Reduced motion.** With `prefers-reduced-motion`, each scene draws one still frame and CSS animations are off. Frames are redrawn on resize or theme change.
- **Fallback.** If WebGL is unavailable, the scenes are skipped and the page still works.

Theme: dark by default. The toggle (or `theme` in the terminal) switches to warm paper white, and the choice is saved in `localStorage`. The 3D colours follow the CSS tokens.

Terminal: press `~` anywhere. Commands are `help`, `about`, `projects`, `contact`, `hire`, `theme`, `clear`, plus `open <project>` and `exit`. ↑/↓ steps through history and Tab completes.

## Deploy to Vercel

The repo includes `vercel.json` (Vite preset, `dist/` output, trailing-slash URLs, long-lived caching for hashed assets).

**From the dashboard**

1. Push the project to GitHub.
2. In Vercel, go to **Add New → Project** and import the repo.
3. Keep the detected settings: Framework **Vite**, Build `npm run build`, Output `dist`. Then deploy.

**From the CLI**

```sh
npm i -g vercel
vercel            # first run links the project and creates a preview deploy
vercel --prod     # production deploy
```

Case studies are served at `/work/<slug>/`.
