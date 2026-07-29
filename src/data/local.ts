// src/data/local.ts
// Browser-local backend. Holds the whole meet in one localStorage record and
// notifies subscribers — including other tabs — whenever it changes.

import {
  DEFAULT_TEAMS,
  EMPTY_SNAPSHOT,
  type Actions,
  type EventResult,
  type Fixture,
  type Snapshot,
  type Team,
} from './types';

const STORAGE_KEY = 'arangam:meet:v1';

let state: Snapshot = read();
const listeners = new Set<() => void>();

function read(): Snapshot {
  if (typeof localStorage === 'undefined') return EMPTY_SNAPSHOT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SNAPSHOT;
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    return {
      teams: mergeTeams(parsed.teams),
      results: parsed.results ?? {},
      fixtures: parsed.fixtures ?? {},
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

/**
 * Keeps the roster in sync with the defaults: stored edits win, but a batch
 * added to DEFAULT_TEAMS in a later release still shows up.
 */
function mergeTeams(stored: Team[] | undefined): Team[] {
  if (!stored?.length) return DEFAULT_TEAMS;
  const byId = new Map(stored.map((t) => [t.id, t]));
  return DEFAULT_TEAMS.map((base) => ({ ...base, ...byId.get(base.id) }));
}

function commit(next: Snapshot): void {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or private-mode failure — the in-memory state is still correct.
  }
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = read();
    for (const listener of listeners) listener();
  });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Snapshot {
  return state;
}

/** Empty podium slots are dropped so `Object.keys(results)` means "has a result". */
function prune(result: EventResult): EventResult | null {
  const cleaned: EventResult = {};
  for (const slot of ['first', 'second', 'third'] as const) {
    const placing = result[slot];
    if (placing?.teamId) {
      cleaned[slot] = {
        teamId: placing.teamId,
        ...(placing.athlete?.trim() ? { athlete: placing.athlete.trim() } : {}),
      };
    }
  }
  return Object.keys(cleaned).length ? cleaned : null;
}

export const actions: Actions = {
  setResult(eventId, result) {
    const cleaned = prune(result);
    const results = { ...state.results };
    if (cleaned) results[eventId] = cleaned;
    else delete results[eventId];
    commit({ ...state, results });
  },

  clearResult(eventId) {
    const results = { ...state.results };
    delete results[eventId];
    commit({ ...state, results });
  },

  setFixture(eventId, fixture: Fixture) {
    const trimmed: Fixture = {
      ...(fixture.date?.trim() ? { date: fixture.date.trim() } : {}),
      ...(fixture.time?.trim() ? { time: fixture.time.trim() } : {}),
      ...(fixture.venue?.trim() ? { venue: fixture.venue.trim() } : {}),
    };
    const fixtures = { ...state.fixtures };
    if (Object.keys(trimmed).length) fixtures[eventId] = trimmed;
    else delete fixtures[eventId];
    commit({ ...state, fixtures });
  },

  updateTeam(teamId, patch) {
    commit({
      ...state,
      teams: state.teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t)),
    });
  },

  resetAll() {
    commit({ teams: DEFAULT_TEAMS, results: {}, fixtures: {} });
  },
};
