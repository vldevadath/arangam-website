// src/data/local.ts
// Browser-local backend. Holds the whole meet in one localStorage record and
// notifies subscribers — including other tabs — whenever it changes.

import { defaultProgramme, makeEventId } from './catalog';
import { normalizeName } from './standings';
import {
  DEFAULT_TEAMS,
  type Actions,
  type EventResult,
  type MeetEvent,
  type Snapshot,
  type Team,
} from './types';

const STORAGE_KEY = 'ankam:meet:v2';

export function emptySnapshot(): Snapshot {
  return { teams: DEFAULT_TEAMS, events: defaultProgramme(), results: {} };
}

let state: Snapshot = read();
const listeners = new Set<() => void>();

function read(): Snapshot {
  if (typeof localStorage === 'undefined') return emptySnapshot();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySnapshot();
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    return {
      teams: mergeTeams(parsed.teams),
      // The programme is fully owned by the desk once it exists, so a stored
      // copy is taken as-is — including events removed from the defaults.
      events: parsed.events?.length ? parsed.events : defaultProgramme(),
      results: parsed.results ?? {},
    };
  } catch {
    return emptySnapshot();
  }
}

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

/** Trims, collapses whitespace, and drops blanks and repeats. */
export function cleanPeople(people: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of people ?? []) {
    const name = normalizeName(raw);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue; // the same runner listed twice scores once
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Empty podium slots are dropped, so a key in `results` means "has a result". */
export function pruneResult(result: EventResult): EventResult | null {
  const cleaned: EventResult = {};
  for (const slot of ['first', 'second', 'third'] as const) {
    const placing = result[slot];
    if (placing?.teamId) {
      const people = cleanPeople(placing.people);
      cleaned[slot] = {
        teamId: placing.teamId,
        ...(people.length ? { people } : {}),
      };
    }
  }
  return Object.keys(cleaned).length ? cleaned : null;
}

export const actions: Actions = {
  setResult(eventId, result) {
    const cleaned = pruneResult(result);
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

  addEvent(event) {
    const id = makeEventId(`${event.name}-${event.category}`, state.events.map((e) => e.id));
    commit({ ...state, events: [...state.events, { ...event, id } as MeetEvent] });
    return id;
  },

  updateEvent(eventId, patch) {
    commit({
      ...state,
      events: state.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
    });
  },

  removeEvent(eventId) {
    // Its result would otherwise linger as an orphan the standings ignore but
    // an export would still carry.
    const results = { ...state.results };
    delete results[eventId];
    commit({ ...state, events: state.events.filter((e) => e.id !== eventId), results });
  },

  updateTeam(teamId, patch) {
    commit({
      ...state,
      teams: state.teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t)),
    });
  },

  restoreProgramme() {
    commit({ ...state, events: defaultProgramme() });
  },

  resetResults() {
    commit({ ...state, results: {} });
  },
};
