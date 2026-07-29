// src/hooks/useMeet.ts
// Single entry point for meet data. Which backend answers is decided once, at
// module load, from VITE_CONVEX_URL — so the branch is constant for the life
// of the app and the hooks below obey the rules of hooks either way.

import { useMemo, useSyncExternalStore } from 'react';
import { actions as localActions, getSnapshot, subscribe } from '../data/local';
import { useRemoteActions, useRemoteSnapshot } from '../data/remote';
import { EMPTY_SNAPSHOT, type Actions, type Snapshot } from '../data/types';
import {
  athleteStandings,
  meetProgress,
  teamStandings,
  type AthleteStanding,
  type MeetProgress,
  type TeamStanding,
} from '../data/standings';
import type { Category } from '../data/catalog';

export const USING_CONVEX = Boolean(import.meta.env.VITE_CONVEX_URL);

function useLocalSnapshot(): { snapshot: Snapshot; loading: boolean } {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);
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

  return { snapshot, loading, teams, progress };
}

export function useMeetActions(): Actions {
  return useActionsImpl();
}

export function useAthletes(category?: Category): AthleteStanding[] {
  const { snapshot } = useSnapshotImpl();
  return useMemo(() => athleteStandings(snapshot, category), [snapshot, category]);
}
