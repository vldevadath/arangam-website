// src/data/catalog.ts
// The fixed programme of ARANGAM 2025-26, transcribed from the official
// points sheet. Events themselves never change during the meet — only their
// schedule and their results do — so the catalogue lives in code and the
// mutable parts live in the store.

export type Discipline = 'game' | 'athletics';
export type Category = 'men' | 'women' | 'mixed';

/** Points awarded to placings 1st / 2nd / 3rd. */
export type Podium = readonly [number, number, number];

export type EventDef = {
  /** Stable slug — also the key used by results and schedule records. */
  readonly id: string;
  readonly name: string;
  readonly discipline: Discipline;
  readonly category: Category;
  /** Squad size as printed on the sheet, e.g. "11–16" or "2". */
  readonly squad: string;
  /** Format footnote, e.g. "2 singles & 1 double". */
  readonly note?: string;
  /** Points added to the batch total. */
  readonly overall: Podium;
  /**
   * Points credited to the individual athlete. Only athletics carries an
   * individual championship; team games do not.
   */
  readonly individual?: Podium;
};

const GAME_POINTS: Podium = [10, 5, 2];
const TRACK_POINTS: Podium = [5, 3, 1];
const RELAY_POINTS: Podium = [10, 5, 3];
const INDIVIDUAL_POINTS: Podium = [4, 3, 2];

const RACKET_NOTE = '2 singles & 1 double';

export const GAMES: readonly EventDef[] = [
  { id: 'cricket-m', name: 'Cricket', discipline: 'game', category: 'men', squad: '11–16', overall: GAME_POINTS },
  { id: 'football-m', name: 'Football', discipline: 'game', category: 'men', squad: '11–20', overall: GAME_POINTS },
  { id: 'basketball-m', name: 'Basketball', discipline: 'game', category: 'men', squad: '5–12', overall: GAME_POINTS },
  { id: 'basketball-w', name: 'Basketball', discipline: 'game', category: 'women', squad: '5–12', overall: GAME_POINTS },
  { id: 'volleyball-m', name: 'Volleyball', discipline: 'game', category: 'men', squad: '6–12', overall: GAME_POINTS },
  { id: 'volleyball-w', name: 'Volleyball', discipline: 'game', category: 'women', squad: '6–12', overall: GAME_POINTS },
  { id: 'throwball-w', name: 'Throwball', discipline: 'game', category: 'women', squad: '9–12', overall: GAME_POINTS },
  { id: 'chess-m', name: 'Chess', discipline: 'game', category: 'men', squad: '5', overall: GAME_POINTS },
  { id: 'chess-w', name: 'Chess', discipline: 'game', category: 'women', squad: '5', overall: GAME_POINTS },
  { id: 'badminton-m', name: 'Badminton', discipline: 'game', category: 'men', squad: '2–4', note: RACKET_NOTE, overall: GAME_POINTS },
  { id: 'badminton-w', name: 'Badminton', discipline: 'game', category: 'women', squad: '2–4', note: RACKET_NOTE, overall: GAME_POINTS },
  { id: 'tt-m', name: 'Table Tennis', discipline: 'game', category: 'men', squad: '2–4', note: RACKET_NOTE, overall: GAME_POINTS },
  { id: 'tt-w', name: 'Table Tennis', discipline: 'game', category: 'women', squad: '2–4', note: RACKET_NOTE, overall: GAME_POINTS },
];

/** Track & field: individual events (squad of 2 entries per batch). */
const TRACK_AND_FIELD: ReadonlyArray<[id: string, name: string, category: Category]> = [
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

const RELAYS: ReadonlyArray<[id: string, name: string, category: Category]> = [
  ['relay-4x100', '4 × 100 m Relay', 'men'],
  ['relay-4x100', '4 × 100 m Relay', 'women'],
  ['relay-4x400', '4 × 400 m Relay', 'men'],
  ['relay-4x400', '4 × 400 m Relay', 'women'],
  ['relay-4x100-mixed', '4 × 100 m Mixed Relay', 'mixed'],
];

const suffix: Record<Category, string> = { men: 'm', women: 'w', mixed: 'x' };

export const ATHLETICS: readonly EventDef[] = [
  ...TRACK_AND_FIELD.map(([id, name, category]): EventDef => ({
    id: `${id}-${suffix[category]}`,
    name,
    discipline: 'athletics',
    category,
    squad: '2',
    overall: TRACK_POINTS,
    individual: INDIVIDUAL_POINTS,
  })),
  ...RELAYS.map(([id, name, category]): EventDef => ({
    id: `${id}-${suffix[category]}`,
    name,
    discipline: 'athletics',
    category,
    squad: '4',
    overall: RELAY_POINTS,
    individual: INDIVIDUAL_POINTS,
  })),
];

export const ALL_EVENTS: readonly EventDef[] = [...GAMES, ...ATHLETICS];

const BY_ID = new Map(ALL_EVENTS.map((e) => [e.id, e]));

export function getEvent(id: string): EventDef | undefined {
  return BY_ID.get(id);
}

/** "Basketball · Women" — the label used everywhere an event is named. */
export function eventLabel(e: EventDef): string {
  return e.category === 'mixed' ? e.name : `${e.name} · ${categoryLabel(e.category)}`;
}

export function categoryLabel(c: Category): string {
  return c === 'men' ? 'Men' : c === 'women' ? 'Women' : 'Mixed';
}

export const PLACE_LABELS = ['1st', '2nd', '3rd'] as const;

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
