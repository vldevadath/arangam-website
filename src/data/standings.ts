// src/data/standings.ts
// Every number on the site is derived here. Nothing stores a points total —
// results plus the printed points table are the only inputs, so a corrected
// result can never leave a stale total behind.

import { ALL_EVENTS, getEvent, type Category, type Discipline, type EventDef } from './catalog';
import type { EventResult, Placing, Snapshot, Team } from './types';

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

export type AthleteStanding = {
  name: string;
  teamId: string;
  points: number;
  golds: number;
  silvers: number;
  bronzes: number;
  events: number;
  rank: number;
};

export type DecidedEvent = {
  event: EventDef;
  result: EventResult;
};

/** Walks each recorded podium slot once. */
function forEachPlacing(
  results: Snapshot['results'],
  visit: (event: EventDef, slot: Slot, index: number, placing: Placing) => void,
): void {
  for (const [eventId, result] of Object.entries(results)) {
    const event = getEvent(eventId);
    if (!event) continue; // result left over from an older programme
    SLOTS.forEach((slot, index) => {
      const placing = result[slot];
      if (placing?.teamId) visit(event, slot, index, placing);
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

  forEachPlacing(snapshot.results, (event, _slot, index, placing) => {
    const row = rows.get(placing.teamId);
    if (!row) return;
    const points = event.overall[index];
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

export function athleteStandings(snapshot: Snapshot, category?: Category): AthleteStanding[] {
  const rows = new Map<string, AthleteStanding>();

  forEachPlacing(snapshot.results, (event, _slot, index, placing) => {
    if (!event.individual || !placing.athlete) return;
    if (category && event.category !== category) return;

    // Same athlete name within the same batch is the same person.
    const key = `${placing.teamId}::${placing.athlete.toLowerCase()}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        name: placing.athlete,
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
    row.points += event.individual[index];
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
  return ALL_EVENTS.filter((e) => (discipline ? e.discipline === discipline : true))
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
  const decided = ALL_EVENTS.filter((e) => snapshot.results[e.id]).length;
  const pointsAwarded = teamStandings(snapshot).reduce((sum, t) => sum + t.total, 0);
  return {
    decided,
    total: ALL_EVENTS.length,
    percent: ALL_EVENTS.length ? Math.round((decided / ALL_EVENTS.length) * 100) : 0,
    pointsAwarded,
  };
}

export function teamName(teams: Team[], teamId: string): string {
  return teams.find((t) => t.id === teamId)?.name ?? 'Unknown';
}

export function teamColor(teams: Team[], teamId: string): string {
  return teams.find((t) => t.id === teamId)?.colorHex ?? '#626d7e';
}
