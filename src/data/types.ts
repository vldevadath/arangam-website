// src/data/types.ts

export type Team = {
  id: string;
  /** Display name, e.g. "'24 Batch". Editable from the admin dashboard. */
  name: string;
  /** Short form used in dense tables, e.g. "'24". */
  short: string;
  colorHex: string;
};

/** One podium slot of one event. `athlete` is only recorded for athletics. */
export type Placing = {
  teamId: string;
  athlete?: string;
};

export type EventResult = {
  first?: Placing;
  second?: Placing;
  third?: Placing;
};

/** When and where an event is held. All fields optional until announced. */
export type Fixture = {
  date?: string;
  time?: string;
  venue?: string;
};

export type Snapshot = {
  teams: Team[];
  results: Record<string, EventResult>;
  fixtures: Record<string, Fixture>;
};

export type Actions = {
  setResult: (eventId: string, result: EventResult) => void;
  clearResult: (eventId: string) => void;
  setFixture: (eventId: string, fixture: Fixture) => void;
  updateTeam: (teamId: string, patch: Partial<Omit<Team, 'id'>>) => void;
  resetAll: () => void;
};

export const DEFAULT_TEAMS: Team[] = [
  { id: 'pg-phd', name: 'PG & PhD', short: 'PG', colorHex: '#A855F7' },
  { id: 'batch-22', name: "'22 Batch", short: "'22", colorHex: '#7FC6FF' },
  { id: 'batch-23', name: "'23 Batch", short: "'23", colorHex: '#2FB673' },
  { id: 'batch-24', name: "'24 Batch", short: "'24", colorHex: '#F7CE5B' },
  { id: 'batch-25', name: "'25 Batch", short: "'25", colorHex: '#C4562C' },
];

export const EMPTY_SNAPSHOT: Snapshot = {
  teams: DEFAULT_TEAMS,
  results: {},
  fixtures: {},
};
