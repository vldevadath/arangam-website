# അരങ്ങം · ARANGAM 2025–26

The website for **Arangam**, the interbatch sports meet of the Agastya Students' Union,
Kerala Agricultural University, College of Agriculture, Vellayani.

Live standings, the full programme with its points table, event-by-event results, and the
individual athletics championship — plus a results desk for recording outcomes from the ground.

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

Nothing stores a points total. The only inputs are **the podium of each event** and **the
official points table**, both of which the site derives everything from — so correcting a
result can never leave a stale total behind.

The programme itself lives in code, at `src/data/catalog.ts`, transcribed from the official
sheet (kept for reference at `docs/points-sheet.jpg`):

| | Overall (batch) | Individual (athlete) |
| --- | --- | --- |
| 13 team games | 10 / 5 / 2 | — |
| 24 track & field events | 5 / 3 / 1 | 4 / 3 / 2 |
| 5 relays | 10 / 5 / 3 | 4 / 3 / 2 |

Individual points only exist in athletics, and they build the individual championship on
`/champions`. All the derivations live in `src/data/standings.ts`.

## Results desk

`/desk` — passcode **`arangam@desk2526`**, or set `VITE_DESK_PASSCODE` to change it.

Pick an event, set its podium and fixture, save. Points follow automatically from the placing.
The **Data** tab exports and imports the whole meet as JSON.

> The passcode keeps the desk out of the way of casual visitors. It is **not** a security
> boundary — a static site has no server to check it against. Put the site behind Netlify
> password protection, or move to the Convex backend below, before that matters.

## Where results are stored

By default: **this browser**, in `localStorage`, synced across tabs. Fine for one person at
one laptop running the scoreboard — export a backup from the Data tab after each session.

For results that are shared and live across devices, point it at Convex:

```bash
npx convex dev        # creates a deployment, writes VITE_CONVEX_URL to .env.local
```

The backend is already written (`convex/schema.ts`, `convex/meet.ts`). Setting
`VITE_CONVEX_URL` is the whole switch — `src/hooks/useMeet.ts` picks the backend once at
module load and every page carries on unchanged.

## Deploying

Netlify picks up `netlify.toml` as-is (build `npm run build`, publish `dist`). The SPA
redirect is in `public/_redirects` so deep links like `/standings` resolve.

If you use Convex, set `VITE_CONVEX_URL` in the site's environment variables and run
`npx convex deploy` for the production deployment.

## Layout

```
src/
  data/        catalog (the programme) · local + remote backends · standings math · auth
  hooks/       useMeet — the one entry point for meet data
  components/  Crest (keys the logo's black field out) · layout shell · shared UI
  pages/       Home · Events · Standings · Results · Champions · Desk
convex/        schema + functions for the optional shared backend
```
