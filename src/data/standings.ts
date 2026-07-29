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
};

export type DecidedEvent = { event: MeetEvent; result: EventResult };

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

  forEachPlacing(snapshot, (event, index, placing) => {
    if (!event.individual || !placing.person) return;
    if (category && event.category !== category) return;

    // Same name within the same batch is the same person.
    const key = `${placing.teamId}::${placing.person.trim().toLowerCase()}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        name: placing.person.trim(),
        teamId: placing.teamId,
        points: 0,
        golds: 0,
        silvers: 0,
        bronzes: 0,
        events: 0,
        rank: 0,
      };
      rows.set(key, row);
    }
    row.points += event.individual[index] ?? 0;
    row.events += 1;
    if (index === 0) row.golds += 1;
    else if (index === 1) row.silvers += 1;
    else row.bronzes += 1;
  });

  const sorted = [...rows.values()].sort(
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
