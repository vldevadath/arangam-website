# അരങ്ങം · ARANGAM 2025–26

The website for **Arangam**, the interbatch sports meet of the Agastya Students' Union,
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

`/desk` — passcode **`arangam@desk2526`**, or set `VITE_DESK_PASSCODE` to change it.

| Tab | What it does |
| --- | --- |
| **Results** | Set the podium for an event. Points follow automatically from the placing. |
| **Programme** | Rename events, change their points, add new ones, remove them, and switch individual scoring on or off per event. |
| **Batches** | Batch names, short forms and colours. |
| **Data** | Export/import the whole meet as JSON, restore the printed programme, clear results. |

Editing an event's points immediately re-scores every result already recorded against it.
Removing an event takes its result with it.

> The passcode keeps the desk out of the way of casual visitors. It is **not** a security
> boundary — a static site has no server to check it against. Put the site behind Netlify
> password protection, or move to the Convex backend below, before that matters.

## Where the meet is stored

By default: **this browser**, in `localStorage`, synced across tabs. Fine for one person
running the scoreboard from one laptop — export a backup from the Data tab after each session.

For a meet that is shared and live across devices, point it at Convex:

```bash
npx convex dev        # creates a deployment, writes VITE_CONVEX_URL to .env.local
```

The backend is already written (`convex/schema.ts`, `convex/meet.ts`) and seeds itself from the
printed programme on first run. Setting `VITE_CONVEX_URL` is the whole switch —
`src/hooks/useMeet.ts` picks the backend once at module load and every page carries on
unchanged.

## Deploying

Netlify picks up `netlify.toml` as-is (build `npm run build`, publish `dist`). The SPA redirect
is in `public/_redirects` so deep links like `/standings` resolve.

If you use Convex, set `VITE_CONVEX_URL` in the site's environment variables and run
`npx convex deploy` for the production deployment.

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
