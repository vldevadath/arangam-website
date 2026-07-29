// src/data/remote.ts
// Convex backend. Used only when VITE_CONVEX_URL is set; see README.
//
// Functions are addressed through `anyApi` rather than convex/_generated/api
// so the app builds and type-checks on a clone that has never run
// `npx convex dev`. The arguments still match convex/meet.ts exactly.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import { defaultProgramme, makeEventId } from './catalog';
import type { Actions, MeetEvent, Snapshot } from './types';

const api = anyApi.meet;

const EMPTY: Snapshot = { teams: [], events: [], results: {} };

/** convex/meet.ts keys events by `eventId`; the app keys them by `id`. */
function toWire(event: MeetEvent) {
  return {
    eventId: event.id,
    name: event.name,
    discipline: event.discipline,
    category: event.category,
    squad: event.squad,
    note: event.note,
    overall: event.overall,
    individual: event.individual,
  };
}

export function useRemoteSnapshot(): { snapshot: Snapshot; loading: boolean } {
  const data = useQuery(api.snapshot) as Snapshot | undefined;
  const seed = useMutation(api.seed);
  const seeded = useRef(false);

  // First visit against a fresh deployment: plant the printed programme once.
  useEffect(() => {
    if (seeded.current || !data || data.events.length > 0) return;
    seeded.current = true;
    void seed({ events: defaultProgramme().map(toWire) });
  }, [data, seed]);

  return { snapshot: data ?? EMPTY, loading: data === undefined };
}

export function useRemoteActions(): Actions {
  const snapshot = useQuery(api.snapshot) as Snapshot | undefined;
  const setResultFn = useMutation(api.setResult);
  const clearResultFn = useMutation(api.clearResult);
  const addEventFn = useMutation(api.addEvent);
  const updateEventFn = useMutation(api.updateEvent);
  const removeEventFn = useMutation(api.removeEvent);
  const updateTeamFn = useMutation(api.updateTeam);
  const restoreFn = useMutation(api.restoreProgramme);
  const resetFn = useMutation(api.resetResults);

  const setResult = useCallback<Actions['setResult']>(
    (eventId, result) => void setResultFn({ eventId, ...result }),
    [setResultFn],
  );
  const clearResult = useCallback<Actions['clearResult']>(
    (eventId) => void clearResultFn({ eventId }),
    [clearResultFn],
  );
  const addEvent = useCallback<Actions['addEvent']>(
    (event) => {
      const id = makeEventId(`${event.name}-${event.category}`, snapshot?.events.map((e) => e.id) ?? []);
      void addEventFn(toWire({ ...event, id }));
      return id;
    },
    [addEventFn, snapshot],
  );
  const updateEvent = useCallback<Actions['updateEvent']>(
    (eventId, patch) => {
      // `undefined` would be dropped in transit, so a cleared individual
      // podium is sent as an explicit null.
      const individual = 'individual' in patch ? (patch.individual ?? null) : undefined;
      void updateEventFn({ eventId, ...patch, individual });
    },
    [updateEventFn],
  );
  const removeEvent = useCallback<Actions['removeEvent']>(
    (eventId) => void removeEventFn({ eventId }),
    [removeEventFn],
  );
  const updateTeam = useCallback<Actions['updateTeam']>(
    (teamId, patch) => void updateTeamFn({ teamId, ...patch }),
    [updateTeamFn],
  );
  const restoreProgramme = useCallback<Actions['restoreProgramme']>(
    () => void restoreFn({ events: defaultProgramme().map(toWire) }),
    [restoreFn],
  );
  const resetResults = useCallback<Actions['resetResults']>(() => void resetFn({}), [resetFn]);

  return useMemo(
    () => ({
      setResult,
      clearResult,
      addEvent,
      updateEvent,
      removeEvent,
      updateTeam,
      restoreProgramme,
      resetResults,
    }),
    [setResult, clearResult, addEvent, updateEvent, removeEvent, updateTeam, restoreProgramme, resetResults],
  );
}
