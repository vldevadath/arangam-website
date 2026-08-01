// src/data/standings.ts
// Every number on the site is derived here. Nothing stores a points total —
// the podium of each event and that event's own points table are the only
// inputs, so a corrected result can never leave a stale total behind.

import type { Category, Discipline, EventResult, MeetEvent, Placing, Snapshot, Team } from './types';

const SLOTS = ['first', 'second', 'third'] as const;
export type Slot = (typeof SLOTS)[number];

export type TeamStanding = Team & {
  /** What this particular table ranks on. */
  total: number;
  gamePoints: number;
  /** Raw points won in athletics events — ranks the athletics table only. */
  athleticsPoints: number;
  /** 10 / 6 / 2 carried into the main total for topping athletics. */
  athleticsBonus: number;
  golds: number;
  silvers: number;
  bronzes: number;
  /** 1-based; ties share a rank. */
  rank: number;
};

/**
 * Athletics is a championship of its own. Its raw points do not reach the main
 * table — instead the batches that finish first, second and third in the men's
 * and again in the women's athletics standings carry these into the main total.
 */
export const ATHLETICS_CHAMPION_POINTS = [10, 6, 2] as const;

/** Categories that crown an athletics champion. Mixed events are not one. */
const CHAMPIONSHIP_CATEGORIES: Category[] = ['men', 'women'];

export type PersonStanding = {
  name: string;
  teamId: string;
  points: number;
  golds: number;
  silvers: number;
  bronzes: number;
  /** Distinct events this person has been placed in. */
  events: number;
  rank: number;
  /**
   * Inferred from the men's/women's events they entered, so mixed-event points
   * can still be credited under the right heading. Undefined when they have
   * only ever appeared in mixed events.
   */
  category?: Category;
};

export type DecidedEvent = { event: MeetEvent; result: EventResult };

/**
 * Names are typed by different volunteers on different phones, so they are
 * matched forgivingly: surrounding and repeated whitespace is collapsed and
 * case is ignored. "arjun  nair" and "Arjun Nair" are one person. Spelling
 * still has to agree — the desk offers the names already entered to make that
 * the easy path.
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function nameKey(teamId: string, name: string): string {
  return `${teamId}::${normalizeName(name).toLowerCase()}`;
}

/**
 * Names already recorded, grouped by batch, for the desk's suggestions. Keyed
 * by batch because a person belongs to one — offering another batch's roster
 * would invite exactly the cross-batch mix-up the suggestions exist to avoid.
 */
export function peopleByTeam(snapshot: Snapshot): Record<string, string[]> {
  const byTeam = new Map<string, Set<string>>();
  forEachPlacing(snapshot, (_event, _index, placing) => {
    if (!placing.person) return;
    let names = byTeam.get(placing.teamId);
    if (!names) byTeam.set(placing.teamId, (names = new Set()));
    names.add(normalizeName(placing.person));
  });
  return Object.fromEntries(
    [...byTeam].map(([teamId, names]) => [teamId, [...names].sort((a, b) => a.localeCompare(b))]),
  );
}

/** Walks each recorded podium slot once, skipping results with no event. */
function forEachPlacing(
  snapshot: Snapshot,
  visit: (event: MeetEvent, index: number, placing: Placing) => void,
): void {
  for (const event of snapshot.events) {
    const result = snapshot.results[event.id];
    if (!result) continue;
    SLOTS.forEach((slot, index) => {
      const placing = result[slot];
      if (placing?.teamId) visit(event, index, placing);
    });
  }
}

/** Blank rows for every batch, ready to be tallied into. */
function emptyRows(snapshot: Snapshot): Map<string, TeamStanding> {
  return new Map(
    snapshot.teams.map((team) => [
      team.id,
      {
        ...team,
        total: 0,
        gamePoints: 0,
        athleticsPoints: 0,
        athleticsBonus: 0,
        golds: 0,
        silvers: 0,
        bronzes: 0,
        rank: 0,
      },
    ]),
  );
}

/**
 * How much of an event's points count towards a given category's table.
 *
 * A mixed event is raced by men and women together, so its points are split
 * evenly: winning the mixed relay is worth 5 on the men's side and 5 on the
 * women's. Second and third split the same way, which is where the halves in
 * those tables come from.
 */
export function categoryWeight(event: MeetEvent, category?: Category): number {
  if (!category) return 1; // the combined table counts everything once
  if (event.category === category) return 1;
  if (event.category === 'mixed') return 0.5;
  return 0;
}

/** Tallies overall points and medals across the events a filter accepts. */
function tally(
  snapshot: Snapshot,
  weightOf: (event: MeetEvent) => number,
): Map<string, TeamStanding> {
  const rows = emptyRows(snapshot);
  forEachPlacing(snapshot, (event, index, placing) => {
    const weight = weightOf(event);
    if (weight <= 0) return;
    const row = rows.get(placing.teamId);
    if (!row) return;
    const points = (event.overall[index] ?? 0) * weight;
    if (event.discipline === 'game') row.gamePoints += points;
    else row.athleticsPoints += points;
    // A shared mixed placing is one medal on the combined table, not one on
    // each side — only a whole entry in this category counts as a medal.
    if (weight === 1) {
      if (index === 0) row.golds += 1;
      else if (index === 1) row.silvers += 1;
      else row.bronzes += 1;
    }
  });
  return rows;
}

function rankBy(rows: Iterable<TeamStanding>): TeamStanding[] {
  const sorted = [...rows].sort(
    (a, b) => b.total - a.total || b.golds - a.golds || b.silvers - a.silvers || a.name.localeCompare(b.name),
  );
  return assignRanks(sorted, (row) => row.total);
}

const isGame = (e: MeetEvent) => e.discipline === 'game';
const isAthletics = (e: MeetEvent) => e.discipline === 'athletics';

/** True once every athletics event has a declared result. */
export function athleticsComplete(snapshot: Snapshot): boolean {
  const events = snapshot.events.filter(isAthletics);
  return events.length > 0 && events.every((e) => snapshot.results[e.id]);
}

/** The games championship — points as won, event by event. */
export function gamesStandings(snapshot: Snapshot): TeamStanding[] {
  const rows = tally(snapshot, (e) => (isGame(e) ? 1 : 0));
  for (const row of rows.values()) row.total = row.gamePoints;
  return rankBy(rows.values());
}

/**
 * The athletics championship, ranked on raw athletics points. Narrow it to a
 * category to get the men's or women's table that decides the 10 / 6 / 2.
 */
export function athleticsStandings(snapshot: Snapshot, category?: Category): TeamStanding[] {
  const rows = tally(snapshot, (e) => (isAthletics(e) ? categoryWeight(e, category) : 0));
  for (const row of rows.values()) row.total = row.athleticsPoints;
  return rankBy(rows.values());
}

/**
 * What each batch carries into the main total from athletics. Empty until every
 * athletics event is decided — awarding it earlier would let the main standings
 * reshuffle on a ranking that is not yet final.
 */
export function athleticsChampionPoints(snapshot: Snapshot): Record<string, number> {
  if (!athleticsComplete(snapshot)) return {};

  const bonus: Record<string, number> = {};
  for (const category of CHAMPIONSHIP_CATEGORIES) {
    for (const row of athleticsStandings(snapshot, category)) {
      // A batch that scored nothing has not placed, whatever its rank reads.
      if (row.total <= 0) continue;
      const points = ATHLETICS_CHAMPION_POINTS[row.rank - 1];
      if (points) bonus[row.id] = (bonus[row.id] ?? 0) + points;
    }
  }
  return bonus;
}

/**
 * The main championship. Games points count as they are won; athletics arrives
 * only as the 10 / 6 / 2 earned for topping the men's and women's athletics
 * tables, once athletics is complete.
 */
export function teamStandings(snapshot: Snapshot): TeamStanding[] {
  const rows = tally(snapshot, () => 1);
  const bonus = athleticsChampionPoints(snapshot);
  for (const row of rows.values()) {
    row.athleticsBonus = bonus[row.id] ?? 0;
    row.total = row.gamePoints + row.athleticsBonus;
  }
  return rankBy(rows.values());
}

/**
 * The individual championship. Anyone named on a podium of an event that
 * carries individual points appears here, and their points accumulate across
 * every event they place in — a person may compete in as many as they like.
 */
export function personStandings(snapshot: Snapshot, category?: Category): PersonStanding[] {
  const rows = new Map<string, PersonStanding>();
  // A mixed event does not say whether the person in it is a man or a woman,
  // so their own men's/women's entries are counted and the majority decides.
  const seen = new Map<string, { men: number; women: number }>();

  forEachPlacing(snapshot, (event, index, placing) => {
    if (!event.individual || !placing.person) return;

    // Same name within the same batch is the same person.
    const key = nameKey(placing.teamId, placing.person);
    let row = rows.get(key);
    if (!row) {
      row = {
        name: normalizeName(placing.person),
        teamId: placing.teamId,
        points: 0,
        golds: 0,
        silvers: 0,
        bronzes: 0,
        events: 0,
        rank: 0,
      };
      rows.set(key, row);
      seen.set(key, { men: 0, women: 0 });
    }

    // Points always cover every event the person placed in, mixed included —
    // filtering happens on the person below, never on the event.
    row.points += event.individual[index] ?? 0;
    row.events += 1;
    if (index === 0) row.golds += 1;
    else if (index === 1) row.silvers += 1;
    else row.bronzes += 1;

    if (event.category === 'men') seen.get(key)!.men += 1;
    else if (event.category === 'women') seen.get(key)!.women += 1;
  });

  for (const [key, row] of rows) {
    const { men, women } = seen.get(key)!;
    // Undefined when someone has only ever run mixed events — they still
    // appear in the overall table, just not under either heading.
    row.category = men > women ? 'men' : women > men ? 'women' : undefined;
  }

  const pool = category ? [...rows.values()].filter((r) => r.category === category) : [...rows.values()];

  const sorted = pool.sort(
    (a, b) => b.points - a.points || b.golds - a.golds || a.name.localeCompare(b.name),
  );

  return assignRanks(sorted, (row) => row.points);
}

function assignRanks<T>(sorted: T[], scoreOf: (row: T) => number): (T & { rank: number })[] {
  let lastScore = Number.NaN;
  let lastRank = 0;
  return sorted.map((row, i) => {
    const score = scoreOf(row);
    if (score !== lastScore) {
      lastRank = i + 1;
      lastScore = score;
    }
    return { ...row, rank: lastRank };
  });
}

/** Events with at least one podium slot filled, in programme order. */
export function decidedEvents(snapshot: Snapshot, discipline?: Discipline): DecidedEvent[] {
  return snapshot.events
    .filter((e) => (discipline ? e.discipline === discipline : true))
    .filter((e) => snapshot.results[e.id])
    .map((event) => ({ event, result: snapshot.results[event.id] }));
}

export type MeetProgress = {
  decided: number;
  total: number;
  percent: number;
  pointsAwarded: number;
};

export function meetProgress(snapshot: Snapshot): MeetProgress {
  const total = snapshot.events.length;
  const decided = snapshot.events.filter((e) => snapshot.results[e.id]).length;
  const pointsAwarded = teamStandings(snapshot).reduce((sum, t) => sum + t.total, 0);
  return {
    decided,
    total,
    percent: total ? Math.round((decided / total) * 100) : 0,
    pointsAwarded,
  };
}

/** Splitting a mixed placing yields halves; show 5 as "5" and 2.5 as "2.5". */
export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

export function teamName(teams: Team[], teamId: string): string {
  return teams.find((t) => t.id === teamId)?.name ?? 'Unknown';
}

export function teamColor(teams: Team[], teamId: string): string {
  return teams.find((t) => t.id === teamId)?.colorHex ?? '#626d7e';
}
