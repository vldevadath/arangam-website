// src/data/types.ts

export type Discipline = 'game' | 'athletics';
export type Category = 'men' | 'women' | 'mixed';

/** Points awarded to placings 1st / 2nd / 3rd. */
export type Podium = [number, number, number];

/**
 * One event on the programme. Every field is editable from the results desk —
 * the printed sheet only seeds the defaults, it does not constrain the meet.
 */
export type MeetEvent = {
  id: string;
  name: string;
  discipline: Discipline;
  category: Category;
  /** Squad size as text, e.g. "11–16" or "2". Free-form on purpose. */
  squad: string;
  /** Format footnote, e.g. "2 singles & 1 double". */
  note?: string;
  /** Points added to the batch total. */
  overall: Podium;
  /**
   * Points credited to the individual competitor. Absent means the event does
   * not count towards the individual championship.
   */
  individual?: Podium;
  /**
   * How many people share one placing. 1 for a race or a jump, 4 for a relay
   * where the whole squad is named. Not the same as `squad`, which counts
   * entries per batch — a 100 m has a squad of 2 but each placing is one
   * runner. Absent means 1.
   */
  crew?: number;
};

export type Team = {
  id: string;
  /** Display name, e.g. "'24 Batch". */
  name: string;
  /** Short form used in dense tables, e.g. "'24". */
  short: string;
  colorHex: string;
};

/**
 * One podium slot of one event. `people` names everyone in it — one runner for
 * a race, all four for a relay. Empty for a team game, where only the batch
 * is recorded.
 */
export type Placing = {
  teamId: string;
  people?: string[];
};

export type EventResult = {
  first?: Placing;
  second?: Placing;
  third?: Placing;
};

export type Snapshot = {
  teams: Team[];
  events: MeetEvent[];
  results: Record<string, EventResult>;
};

export type Actions = {
  setResult: (eventId: string, result: EventResult) => void;
  clearResult: (eventId: string) => void;
  addEvent: (event: Omit<MeetEvent, 'id'>) => string;
  updateEvent: (eventId: string, patch: Partial<Omit<MeetEvent, 'id'>>) => void;
  removeEvent: (eventId: string) => void;
  updateTeam: (teamId: string, patch: Partial<Omit<Team, 'id'>>) => void;
  restoreProgramme: () => void;
  resetResults: () => void;
};

export const DEFAULT_TEAMS: Team[] = [
  { id: 'pg-phd', name: 'PG & PhD', short: 'PG', colorHex: '#A855F7' },
  { id: 'batch-22', name: "'22 Batch", short: "'22", colorHex: '#7FC6FF' },
  { id: 'batch-23', name: "'23 Batch", short: "'23", colorHex: '#2FB673' },
  { id: 'batch-24', name: "'24 Batch", short: "'24", colorHex: '#F7CE5B' },
  { id: 'batch-25', name: "'25 Batch", short: "'25", colorHex: '#C4562C' },
];
