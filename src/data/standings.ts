// src/data/standings.ts
// Every number on the site is derived here. Nothing stores a points total —
// the podium of each event and that event's own points table are the only
// inputs, so a corrected result can never leave a stale total behind.

import type { Category, Discipline, EventResult, MeetEvent, Placing, Snapshot, Team } from './types';

const SLOTS = ['first', 'second', 'third'] as const;
export type Slot = (typeof SLOTS)[number];

export type TeamStanding = Team & {
  total: number;
  gamePoints: number;
  athleticsPoints: number;
  golds: number;
  silvers: number;
  bronzes: number;
  /** 1-based; ties share a rank. */
  rank: number;
};

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

export function teamStandings(snapshot: Snapshot): TeamStanding[] {
  const rows = new Map<string, TeamStanding>(
    snapshot.teams.map((team) => [
      team.id,
      { ...team, total: 0, gamePoints: 0, athleticsPoints: 0, golds: 0, silvers: 0, bronzes: 0, rank: 0 },
    ]),
  );

  forEachPlacing(snapshot, (event, index, placing) => {
    const row = rows.get(placing.teamId);
    if (!row) return;
    const points = event.overall[index] ?? 0;
    row.total += points;
    if (event.discipline === 'game') row.gamePoints += points;
    else row.athleticsPoints += points;
    if (index === 0) row.golds += 1;
    else if (index === 1) row.silvers += 1;
    else row.bronzes += 1;
  });

  const sorted = [...rows.values()].sort(
    (a, b) => b.total - a.total || b.golds - a.golds || b.silvers - a.silvers || a.name.localeCompare(b.name),
  );

  return assignRanks(sorted, (row) => row.total);
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

export function teamName(teams: Team[], teamId: string): string {
  return teams.find((t) => t.id === teamId)?.name ?? 'Unknown';
}

export function teamColor(teams: Team[], teamId: string): string {
  return teams.find((t) => t.id === teamId)?.colorHex ?? '#626d7e';
}
