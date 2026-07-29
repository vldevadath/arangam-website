// src/data/remote.ts
// Convex backend. Used only when VITE_CONVEX_URL is set; see README.
//
// Functions are addressed through `anyApi` rather than convex/_generated/api
// so the app builds and type-checks on a clone that has never run
// `npx convex dev`. The arguments still match convex/meet.ts exactly.

import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import { EMPTY_SNAPSHOT, type Actions, type Snapshot } from './types';

const api = anyApi.meet;

export function useRemoteSnapshot(): { snapshot: Snapshot; loading: boolean } {
  const data = useQuery(api.snapshot) as Snapshot | undefined;
  const seedTeams = useMutation(api.seedTeams);

  // First visit against a fresh deployment: plant the roster once.
  useEffect(() => {
    if (data && data.teams.length === 0) void seedTeams({});
  }, [data, seedTeams]);

  return {
    snapshot: data ?? EMPTY_SNAPSHOT,
    loading: data === undefined,
  };
}

export function useRemoteActions(): Actions {
  const setResultFn = useMutation(api.setResult);
  const clearResultFn = useMutation(api.clearResult);
  const setFixtureFn = useMutation(api.setFixture);
  const updateTeamFn = useMutation(api.updateTeam);
  const resetAllFn = useMutation(api.resetAll);

  const setResult = useCallback<Actions['setResult']>(
    (eventId, result) => void setResultFn({ eventId, ...result }),
    [setResultFn],
  );
  const clearResult = useCallback<Actions['clearResult']>(
    (eventId) => void clearResultFn({ eventId }),
    [clearResultFn],
  );
  const setFixture = useCallback<Actions['setFixture']>(
    (eventId, fixture) => void setFixtureFn({ eventId, ...fixture }),
    [setFixtureFn],
  );
  const updateTeam = useCallback<Actions['updateTeam']>(
    (teamId, patch) => void updateTeamFn({ teamId, ...patch }),
    [updateTeamFn],
  );
  const resetAll = useCallback<Actions['resetAll']>(() => void resetAllFn({}), [resetAllFn]);

  return useMemo(
    () => ({ setResult, clearResult, setFixture, updateTeam, resetAll }),
    [setResult, clearResult, setFixture, updateTeam, resetAll],
  );
}
