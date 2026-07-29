// src/hooks/useMeet.ts
// Single entry point for meet data. Which backend answers is decided once, at
// module load, from VITE_CONVEX_URL — so the branch is constant for the life
// of the app and the hooks below obey the rules of hooks either way.

import { useMemo, useSyncExternalStore } from 'react';
import { actions as localActions, emptySnapshot, getSnapshot, subscribe } from '../data/local';
import { useRemoteActions, useRemoteSnapshot } from '../data/remote';
import type { Actions, Category, Snapshot } from '../data/types';
import {
  meetProgress,
  personStandings,
  teamStandings,
  type MeetProgress,
  type PersonStanding,
  type TeamStanding,
} from '../data/standings';

export const USING_CONVEX = Boolean(import.meta.env.VITE_CONVEX_URL);

const SERVER_SNAPSHOT = emptySnapshot();

function useLocalSnapshot(): { snapshot: Snapshot; loading: boolean } {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  return { snapshot, loading: false };
}

function useLocalActions(): Actions {
  return localActions;
}

const useSnapshotImpl = USING_CONVEX ? useRemoteSnapshot : useLocalSnapshot;
const useActionsImpl = USING_CONVEX ? useRemoteActions : useLocalActions;

export function useMeet() {
  const { snapshot, loading } = useSnapshotImpl();

  const teams = useMemo<TeamStanding[]>(() => teamStandings(snapshot), [snapshot]);
  const progress = useMemo<MeetProgress>(() => meetProgress(snapshot), [snapshot]);

  return { snapshot, loading, teams, progress, events: snapshot.events };
}

export function useMeetActions(): Actions {
  return useActionsImpl();
}

/** The individual championship, optionally narrowed to one event category. */
export function usePeople(category?: Category): PersonStanding[] {
  const { snapshot } = useSnapshotImpl();
  return useMemo(() => personStandings(snapshot, category), [snapshot, category]);
}
