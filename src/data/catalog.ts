// src/data/catalog.ts
// The programme as printed on the official sheet. This only *seeds* the meet —
// once a copy exists in the store, the results desk owns it: events can be
// renamed, re-pointed, added or removed. `docs/points-sheet.jpg` is the source.

import type { Category, MeetEvent, Podium } from './types';

const GAME_POINTS: Podium = [10, 5, 2];
const TRACK_POINTS: Podium = [5, 3, 1];
const RELAY_POINTS: Podium = [10, 5, 3];
const INDIVIDUAL_POINTS: Podium = [4, 3, 2];

const RACKET_NOTE = '2 singles & 1 double';

const DEFAULT_GAMES: MeetEvent[] = [
  { id: 'cricket-m', name: 'Cricket', discipline: 'game', category: 'men', squad: '11–16', overall: [...GAME_POINTS] },
  { id: 'football-m', name: 'Football', discipline: 'game', category: 'men', squad: '11–20', overall: [...GAME_POINTS] },
  { id: 'basketball-m', name: 'Basketball', discipline: 'game', category: 'men', squad: '5–12', overall: [...GAME_POINTS] },
  { id: 'basketball-w', name: 'Basketball', discipline: 'game', category: 'women', squad: '5–12', overall: [...GAME_POINTS] },
  { id: 'volleyball-m', name: 'Volleyball', discipline: 'game', category: 'men', squad: '6–12', overall: [...GAME_POINTS] },
  { id: 'volleyball-w', name: 'Volleyball', discipline: 'game', category: 'women', squad: '6–12', overall: [...GAME_POINTS] },
  { id: 'throwball-w', name: 'Throwball', discipline: 'game', category: 'women', squad: '9–12', overall: [...GAME_POINTS] },
  { id: 'chess-m', name: 'Chess', discipline: 'game', category: 'men', squad: '5', overall: [...GAME_POINTS] },
  { id: 'chess-w', name: 'Chess', discipline: 'game', category: 'women', squad: '5', overall: [...GAME_POINTS] },
  { id: 'badminton-m', name: 'Badminton', discipline: 'game', category: 'men', squad: '2–4', note: RACKET_NOTE, overall: [...GAME_POINTS] },
  { id: 'badminton-w', name: 'Badminton', discipline: 'game', category: 'women', squad: '2–4', note: RACKET_NOTE, overall: [...GAME_POINTS] },
  { id: 'tt-m', name: 'Table Tennis', discipline: 'game', category: 'men', squad: '2–4', note: RACKET_NOTE, overall: [...GAME_POINTS] },
  { id: 'tt-w', name: 'Table Tennis', discipline: 'game', category: 'women', squad: '2–4', note: RACKET_NOTE, overall: [...GAME_POINTS] },
];

const TRACK_AND_FIELD: ReadonlyArray<[slug: string, name: string, category: Category]> = [
  ['100m', '100 m Running Race', 'men'],
  ['100m', '100 m Running Race', 'women'],
  ['200m', '200 m Running Race', 'men'],
  ['200m', '200 m Running Race', 'women'],
  ['400m', '400 m Running Race', 'men'],
  ['400m', '400 m Running Race', 'women'],
  ['800m', '800 m Running Race', 'men'],
  ['800m', '800 m Running Race', 'women'],
  ['1500m', '1500 m Running Race', 'men'],
  ['1500m', '1500 m Running Race', 'women'],
  ['walk-5000m', '5000 m Race Walk', 'men'],
  ['walk-3000m', '3000 m Race Walk', 'women'],
  ['shot-put', 'Shot Put', 'men'],
  ['shot-put', 'Shot Put', 'women'],
  ['discus', 'Discus Throw', 'men'],
  ['discus', 'Discus Throw', 'women'],
  ['long-jump', 'Long Jump', 'men'],
  ['long-jump', 'Long Jump', 'women'],
  ['high-jump', 'High Jump', 'men'],
  ['high-jump', 'High Jump', 'women'],
  ['triple-jump', 'Triple Jump', 'men'],
  ['triple-jump', 'Triple Jump', 'women'],
  ['javelin', 'Javelin Throw', 'men'],
  ['javelin', 'Javelin Throw', 'women'],
];

const RELAYS: ReadonlyArray<[slug: string, name: string, category: Category]> = [
  ['relay-4x100', '4 × 100 m Relay', 'men'],
  ['relay-4x100', '4 × 100 m Relay', 'women'],
  ['relay-4x400', '4 × 400 m Relay', 'men'],
  ['relay-4x400', '4 × 400 m Relay', 'women'],
  ['relay-4x100-mixed', '4 × 100 m Mixed Relay', 'mixed'],
];

const SUFFIX: Record<Category, string> = { men: 'm', women: 'w', mixed: 'x' };

const DEFAULT_ATHLETICS: MeetEvent[] = [
  ...TRACK_AND_FIELD.map(([slug, name, category]): MeetEvent => ({
    id: `${slug}-${SUFFIX[category]}`,
    name,
    discipline: 'athletics',
    category,
    squad: '2',
    overall: [...TRACK_POINTS],
    individual: [...INDIVIDUAL_POINTS],
  })),
  ...RELAYS.map(([slug, name, category]): MeetEvent => ({
    id: `${slug}-${SUFFIX[category]}`,
    name,
    discipline: 'athletics',
    category,
    squad: '4',
    overall: [...RELAY_POINTS],
    individual: [...INDIVIDUAL_POINTS],
  })),
];

/** Fresh copy every call — callers own the result and may edit it freely. */
export function defaultProgramme(): MeetEvent[] {
  return [...DEFAULT_GAMES, ...DEFAULT_ATHLETICS].map((e) => ({
    ...e,
    overall: [...e.overall] as Podium,
    individual: e.individual ? ([...e.individual] as Podium) : undefined,
  }));
}

export const DEFAULT_EVENT_COUNT = DEFAULT_GAMES.length + DEFAULT_ATHLETICS.length;

// ─── Labels ─────────────────────────────────────────────────────────────────

export function categoryLabel(c: Category): string {
  return c === 'men' ? 'Men' : c === 'women' ? 'Women' : 'Mixed';
}

/** "Basketball · Women" — how an event is named in running text. */
export function eventLabel(e: MeetEvent): string {
  return e.category === 'mixed' ? e.name : `${e.name} · ${categoryLabel(e.category)}`;
}

/** A url-safe, collision-free id for a newly added event. */
export function makeEventId(name: string, taken: Iterable<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'event';
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

// ─── Meet identity ──────────────────────────────────────────────────────────

export const MEET = {
  nameMl: 'അരങ്ങം',
  name: 'ARANGAM',
  edition: '2025–2026',
  tagline: 'Interbatch Sports',
  union: "Agastya Students' Union 25–26",
  university: 'Kerala Agricultural University',
  college: 'College of Agriculture, Vellayani',
} as const;
