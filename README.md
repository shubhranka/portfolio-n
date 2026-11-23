# Shubhranka Varma · Portfolio

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
| Chalky screenshot | Add an image under `public/work/chalky/` and set `hero.src` (plus `gallery` if you like) |
| Ask-me / Sentinel screenshots (optional) | These have no hero image. To add one, put it in `public/work/<slug>/` and add `hero: { src, alt }` to that `caseStudy` |
| Hackathon details, Chalky role, "What I learned" | the matching `caseStudy` fields |
| Secret-page note (`[[TODO]]`) | `secretNote` in `src/extras.ts`, shown at `/secret` after 5/5 stones |
| Zusk stone word | It's the last word of Zusk's last "What I learned" item, so it follows whatever you write there |
| Live features | Off until you set up Supabase (see **Live features** below) |

The case studies are drafted from each repo's README. Chalky's README is the Next.js starter, so its case study is inferred from `package.json` and is flagged for review.

### Demos, games and secrets

Copy and data for the playful parts of the site (demo scripts, glossary, and later the games, badges and stones) live in [`src/extras.ts`](src/extras.ts).

- **Playable demos.** The Sentinel and Ask-me case studies have a "Try it" section (`#demo`). Their home tiles get a small link to it. Tiles are listed in `demoTiles`, the Sentinel numbers and lines are in `sentinelSim`, and the call script and gauge values are in `askMeReplay`. Nothing plays until the visitor presses a button.
- **Highlight to explain.** On any case-study page, selecting a word that's in `glossary` shows a short explanation card next to it. It closes when you click elsewhere, press Esc or use ×. To add a word, add `{ term, also?, text }`. Matching ignores case, surrounding punctuation and a trailing plural "s".

- **/play.** Four small games and a leaderboard: "Would Zusk run this?", an unbeatable tic-tac-toe AI, a code typing race and the blob playground. It's linked as "Play" in the nav, or the "play" pill in the header on phones.
  - *Add a SQL question:* append `{ sql, ok, why }` to `sqlQuestions`. `ok: true` means Zusk lets it through in read-only mode. The score and "perfect" check use the list length, so nothing else needs changing.
  - *Add a typing snippet:* append `{ repo, code }` to `typingSnippets`. Keep it to one to three real lines. Indentation after a line break is filled in for the typist.
  - *Page copy* (titles, intros, mood names) is in `playPage`.
  - The SQL game and tic-tac-toe ship with the page so nothing shifts when they appear. The typing race, blob and leaderboard load as you scroll to them. The blob reuses `src/three/hero.ts` with `{ playground: true }`, which adds the poke squish and red tint.
  - Personal bests (top five runs per game) and the tic-tac-toe tally are kept in `localStorage` under keys starting with `sv:`.

- **/sketches.** The three concept sketches from the design file (visitor journeys, home wireframe, games & secrets), linked as "Sketches" in the nav. The images are 2x PNGs in `public/sketches/`, and their titles and captions are at the top of `src/sketches.ts`. Clicking a sketch opens it full size in a new tab.
- **Hidden stones.** There are five, listed in `stones`:
  - the dot beside © in the footer
  - every 5th Snake food
  - the `stoneTag` on the toolbox sphere (Three.js, marked ◆)
  - highlighting the last word of the Zusk case study (currently the last word of its last "What I learned" item, so it moves when you rewrite that text)
  - a perfect score in the SQL game

  Each find glows and shows a toast. The nav counter stays hidden until the first find, then fills five amber dots. Clicking it opens the progress shelf. 5/5 unlocks `/secret`, whose note is `secretNote` (marked TODO). `/secret` is only locked in the browser, so the note is visible to anyone who reads the source.
- **Badges.** There are nine, in `badges`. Toasts appear bottom-right, stack up to three, leave after four seconds and let clicks pass through. The shelf opens from the stone counter or the "Badges earned" chip on /play.
  - *Add a badge:* add `{ id, icon, name, how }` to `badges`, then call `award('<id>')` from `src/lib/progress.ts` wherever it's earned.
  - *Speed typist:* the threshold is `typistBar`.
- **Konami code** (↑↑↓↓←→←→BA) switches to CRT mode: VT323 font, scanlines and amber phosphor. Esc exits. It doesn't persist, and the font loads only when you first enter the code.
- **Progress** (stones, badges, scores, tallies) lives in `localStorage` under `sv:` keys, and every access is wrapped in try/catch. "Reset progress" in the shelf, or `reset-progress --yes` in the terminal, clears it. The theme is kept.

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
play/index.html          /play entry → src/play.ts
secret/index.html        /secret entry → src/secret.ts (noindex)
src/live/                presence + cursors, guestbook, global leaderboards (Supabase; flag-gated)
supabase/                schema.sql + the `submit` Edge Function
api/geo.ts               Vercel Edge Function: city for cursor labels
src/games/               SQL quiz, minimax + tic-tac-toe, typing race, blob, leaderboard
src/lib/                 theme, terminal, tilt/reveal, formatting, env detection,
                         store (safe localStorage), scores, progress (stones + badges),
                         secrets (counter, shelf, toasts), toast, konami
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

Terminal: press `~` anywhere. Commands are `help`, `about`, `projects`, `contact`, `hire`, `theme`, `clear`, plus `open <project>`, `play <game>` and `exit`. ↑/↓ steps through history and Tab completes.

- **Games:** `play snake`, `play 2048` and `play ttt` run inside the terminal and take the keyboard until you press `q`. Use the arrow keys; in 2048, `u` undoes (up to 20 moves) and `r` restarts. On touch screens you can swipe on the board, and there's an on-screen key pad. Every 5th Snake food is amber: that's a hidden stone. Each game is its own chunk, loaded when you type the command. They live in `src/lib/termgames/`.
- **Easter eggs** (not listed in `help`): `sudo hire-me` shows a fake password prompt. It only counts keystrokes to draw the asterisks, so the input never holds what you type, and then it prints the email. `rm -rf boredom` suggests a game.

## Live features (optional)

The "N here now" pill, live cursors, the guestbook wall on /play and the global leaderboards use **Supabase** (free tier). They only load when `VITE_LIVE=true` and both keys are set. Otherwise none of the code is fetched and the site works as before. If the service is unreachable they hide themselves: the pill never appears, the guestbook stays hidden and the leaderboard falls back to local bests.

**Why Supabase:** one free service covers Realtime presence and broadcast (pill and cursors) and Postgres with row-level security (guestbook and scores), and you can approve notes in its table editor. PartyKit handles cursors well, but you'd still need a database and an admin view on top.

**Setup**

1. Create a project at [supabase.com](https://supabase.com) (the free tier is enough).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates `guestbook` and `scores` with RLS on. The public anon key can only *read* approved notes and scores. There are no insert/update/delete policies.
3. Deploy the write endpoint with the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```sh
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase functions deploy submit
   supabase secrets set ALLOWED_ORIGINS="https://your-domain.com,http://localhost:5173"
   ```
4. Copy `.env.example` to `.env` and set `VITE_LIVE=true`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from **Project Settings → API**). On Vercel, add the same three variables under **Settings → Environment Variables**. `.env` is git-ignored.
5. Realtime uses a public channel called `site`. If you've turned on "private channels only" in **Realtime settings**, allow public access for it.

**Approving guestbook notes:** new notes are saved with `approved = false` and never shown. In **Table Editor → guestbook**, tick `approved` on the notes you want, or run `update guestbook set approved = true where id = <id>;`. To remove a note, delete its row.

**Safeguards** (all in [`supabase/functions/submit/index.ts`](supabase/functions/submit/index.ts)):
- Writes only come from allowed origins.
- Text is trimmed and length-checked (name 24, line 80, nickname 20), and the database checks the same limits.
- A short profanity list (`BLOCKED`, edit freely) and a no-links rule are applied.
- Scores get plausibility checks: SQL 0–8, typing 1–200 wpm.
- Rate limits: 2 notes and 10 scores per visitor per 10 minutes, plus a global hourly cap. The per-visitor limit is kept in memory and keyed by a salted hash of the IP, so nothing about the visitor is written to the database.
- What's stored is only a display name or nickname plus the text or score. Scores are still sent by the browser, so treat the leaderboard as for fun.

**Cursors:** only mouse and trackpad users send them, about six updates a second while moving, and never from a hidden tab. Cursors show only to people on the same page. Clicking the pill hides or shows them, and the choice is remembered. Labels say "Visitor · <city>" when deployed on Vercel: [`api/geo.ts`](api/geo.ts) returns just the city from Vercel's own location header and stores nothing. Elsewhere, including `npm run dev`, they say "Visitor".

**Free-tier notes:** Supabase pauses free projects after a week without activity (restore it from the dashboard). Realtime has monthly message and concurrent-connection limits, which is why cursor updates are throttled.

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
