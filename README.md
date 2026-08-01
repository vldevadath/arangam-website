# അങ്കം · ANKAM 2025–26

The website for **Ankam**, the interbatch sports meet of the Agastya Students' Union,
Kerala Agricultural University, College of Agriculture, Vellayani.

Live standings, the programme with its points table, event-by-event results, and the individual
championship — plus a results desk for running the whole meet from a phone at the ground.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · React Router 7 · Framer Motion · Convex (optional)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Oxlint |

## How scoring works

Nothing stores a points total. The only inputs are **the podium of each event** and **that
event's own points table** — everything else is derived, so correcting a result or re-pointing
an event can never leave a stale total behind. All of it lives in `src/data/standings.ts`.

Two ledgers run at once:

- **Overall** points go to the batch and decide the championship on `/standings`.
- **Individual** points go to the *person* named against a placing. They accumulate across
  every event that person places in — track, field, relay, or a team game the desk has given
  individual points to — and build the table on `/champions`.

The programme ships seeded from the official sheet (`docs/points-sheet.jpg`): 13 team games at
10/5/2, 24 track & field events at 5/3/1, and 5 relays at 10/5/3, with 4/3/2 individual points
on the athletics events. **None of that is fixed** — see below.

## Results desk

`/desk` — passcode **`ankam@desk2526`**, or set `VITE_DESK_PASSCODE` to change it.

| Tab | What it does |
| --- | --- |
| **Results** | Set the podium for an event. Points follow automatically from the placing. |
| **Programme** | Rename events, change their points, add new ones, remove them, and switch individual scoring on or off per event. |
| **Batches** | Batch names, short forms and colours. |
| **Data** | Export/import the whole meet as JSON, restore the printed programme, clear results. |

Editing an event's points immediately re-scores every result already recorded against it.
Removing an event takes its result with it.

### How the passcode is enforced

With a Convex deployment the passcode never reaches the browser bundle. Signing in asks the
deployment whether it is right, and **every write carries it for `convex/meet.ts` to check
again** before touching the database — so reading the site's JavaScript reveals nothing, and a
console cannot write to the meet. Reads stay public.

Set or change it on the deployment, not in the code:

```bash
npx convex env set DESK_PASSCODE '<passcode>'          # dev
npx convex env set DESK_PASSCODE '<passcode>' --prod   # production
```

Without a deployment the app is a single-browser scratchpad, so the check is local and
`VITE_DESK_PASSCODE` (default `ankam-local`) is a placeholder rather than a secret.

Two limits worth knowing: everyone at the desk shares one passcode, so there is no audit trail
of who changed what; and `checkPasscode` is not rate-limited, so use a passcode long enough
that guessing is not worth the trouble.

## Where the meet is stored

The published site runs on **Convex**: results live in a shared database and reach every open
page over a websocket, so a podium saved at the ground appears on every phone without a
refresh.

With no `VITE_CONVEX_URL` the app falls back to **this browser**, in `localStorage`, synced
across tabs — useful for local development, useless for a real meet.

To point a fresh clone at Convex:

```bash
npx convex dev        # creates a deployment, writes VITE_CONVEX_URL to .env.local
```

The backend is already written (`convex/schema.ts`, `convex/meet.ts`) and seeds itself from the
printed programme on first run. Setting `VITE_CONVEX_URL` is the whole switch —
`src/hooks/useMeet.ts` picks the backend once at module load and every page carries on
unchanged.

## Live

| | |
| --- | --- |
| Site | https://ankam-2526.netlify.app |
| Mirror | https://vldevadath.github.io/ankam-website/ |
| Results desk | https://ankam-2526.netlify.app/desk |
| Convex dashboard | https://dashboard.convex.dev/t/devadath-v-l/ankam-website |
| Production database | `https://valiant-buzzard-674.convex.cloud` |

**Back up daily** from Desk → Data → Export JSON. Clearing results cannot be undone.

## Deploying

### GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
Pause it with `gh workflow disable "Deploy to GitHub Pages"`. It is the only
deployer — Pages is on the "GitHub Actions" build type and there is no `gh-pages` branch, so
nothing races it.

Two details the build depends on:

- `VITE_BASE` sets the `/<repo>/` base path, and `main.tsx` feeds `import.meta.env.BASE_URL`
  to the router's `basename`.
- Pages has no redirect rules, so `vite.config.ts` copies `index.html` to `404.html`. Pages
  serves that for unknown paths, which is how `/standings` resolves. Deep links return a 404
  status while rendering correctly — expected for a SPA on Pages.

`VITE_CONVEX_URL` is set in the workflow rather than in secrets: the Convex client URL is
public by design and ships inside the bundle either way. The desk passcode is **not** in the
bundle — see above.

### Netlify

`netlify.toml` and `public/_redirects` are committed, so build command, publish directory and
SPA routing need no configuration.

Netlify has **no git integration** — it publishes only when this command is
run, so a push never updates it and it can drift behind Pages.

```bash
npx netlify-cli deploy --build --prod
```

If every route answers `401` with a redirect to `app.netlify.com/edge-access`, the **team** has
SSO login required for all sites (`account_sso_login`). It is a UI-only setting — turn it off
under Team settings → Access & security.

### Convex

```bash
npx convex deploy                                       # push functions to production
npx convex env set DESK_PASSCODE '<passcode>' --prod    # change the passcode, no redeploy
```

## Layout

```
src/
  data/        catalog (the seed programme) · local + remote backends · standings math · auth
  hooks/       useMeet — the one entry point for meet data
  components/  Crest (keys the logo's black field out) · layout shell · shared UI
  pages/       Home · Events · Standings · Results · Champions · Desk
convex/        schema + functions for the optional shared backend
docs/          the official points sheet the programme is seeded from
```
