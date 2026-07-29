// src/pages/Desk.tsx
// The results desk. One row per event; expanding a row reveals the podium and
// the fixture for that event. Points are never typed in — they follow from the
// placing and the official points table.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Download, LogOut, Search, Trash2, Upload, X } from 'lucide-react';
import { ALL_EVENTS, MEET, categoryLabel, type EventDef } from '../data/catalog';
import { isSignedIn, signOut } from '../data/auth';
import { CategoryTag, DisciplineTag, MedalBadge, SegmentedControl, Tag, TeamDot } from '../components/ui';
import { useMeet, useMeetActions } from '../hooks/useMeet';
import type { EventResult, Fixture, Placing, Snapshot, Team } from '../data/types';

type Tab = 'events' | 'batches' | 'data';
const SLOTS = ['first', 'second', 'third'] as const;

export default function Desk() {
  const navigate = useNavigate();
  const { snapshot, progress } = useMeet();
  const actions = useMeetActions();
  const [tab, setTab] = useState<Tab>('events');

  useEffect(() => {
    if (!isSignedIn()) navigate('/desk', { replace: true });
  }, [navigate]);

  function handleSignOut() {
    signOut();
    navigate('/desk', { replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20 pb-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-pitch-line pb-5">
        <div>
          <p className="eyebrow">{MEET.name} {MEET.edition}</p>
          <h1 className="mt-2 font-display text-3xl tracking-[0.06em] text-ink-primary uppercase">
            Results Desk
          </h1>
          <p className="score mt-1.5 text-[12px] text-ink-muted">
            {progress.decided}/{progress.total} events decided · {progress.pointsAwarded} points awarded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="btn btn-ghost no-underline">
            View site
          </Link>
          <button onClick={handleSignOut} className="btn btn-ghost">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div className="mt-6">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'events', label: 'Events' },
            { value: 'batches', label: 'Batches' },
            { value: 'data', label: 'Data' },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === 'events' && <EventsTab snapshot={snapshot} actions={actions} />}
        {tab === 'batches' && <BatchesTab teams={snapshot.teams} actions={actions} />}
        {tab === 'data' && <DataTab snapshot={snapshot} actions={actions} />}
      </div>
    </div>
  );
}

// ─── Events ─────────────────────────────────────────────────────────────────

type Actions = ReturnType<typeof useMeetActions>;

function EventsTab({ snapshot, actions }: { snapshot: Snapshot; actions: Actions }) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_EVENTS;
    return ALL_EVENTS.filter((e) =>
      `${e.name} ${categoryLabel(e.category)} ${e.discipline}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <>
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events — e.g. relay, chess, javelin"
          className="field pl-9"
        />
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            snapshot={snapshot}
            actions={actions}
            open={openId === event.id}
            onToggle={() => setOpenId((id) => (id === event.id ? null : event.id))}
          />
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-[13px] text-ink-muted">No event matches “{query}”.</p>
      )}
    </>
  );
}

function EventRow({
  event,
  snapshot,
  actions,
  open,
  onToggle,
}: {
  event: EventDef;
  snapshot: Snapshot;
  actions: Actions;
  open: boolean;
  onToggle: () => void;
}) {
  const stored = snapshot.results[event.id];
  const storedFixture = snapshot.fixtures[event.id];

  const [podium, setPodium] = useState<EventResult>(stored ?? {});
  const [fixture, setFixture] = useState<Fixture>(storedFixture ?? {});
  const [saved, setSaved] = useState(false);

  // Re-sync when the row opens, so it never shows a stale draft.
  useEffect(() => {
    if (open) {
      setPodium(stored ?? {});
      setFixture(storedFixture ?? {});
      setSaved(false);
    }
  }, [open, stored, storedFixture]);

  function setSlot(slot: (typeof SLOTS)[number], patch: Partial<Placing>) {
    setPodium((p) => {
      const next = { ...p };
      const merged = { ...(p[slot] ?? { teamId: '' }), ...patch };
      if (!merged.teamId) delete next[slot];
      else next[slot] = merged;
      return next;
    });
    setSaved(false);
  }

  function save() {
    actions.setResult(event.id, podium);
    actions.setFixture(event.id, fixture);
    setSaved(true);
  }

  function clear() {
    actions.clearResult(event.id);
    setPodium({});
    setSaved(false);
  }

  return (
    <li className="panel overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="font-display text-[15px] tracking-[0.04em] text-ink-primary">
          {event.name}
        </span>
        <CategoryTag category={event.category} />
        <DisciplineTag discipline={event.discipline} />
        {stored ? <Tag tone="turf">Decided</Tag> : <Tag>Pending</Tag>}
        <span className="score ml-auto text-[12px] text-ink-muted">
          {event.overall.join(' / ')}
        </span>
      </button>

      {open && (
        <div className="border-t border-pitch-line px-4 py-5">
          <p className="font-display text-[10px] tracking-[0.24em] text-ink-muted uppercase">
            Podium
          </p>

          <div className="mt-3 space-y-3">
            {SLOTS.map((slot, i) => {
              const placing = podium[slot];
              return (
                <div key={slot} className="flex flex-wrap items-center gap-3">
                  <MedalBadge place={i as 0 | 1 | 2} size="sm" />
                  <select
                    value={placing?.teamId ?? ''}
                    onChange={(e) => setSlot(slot, { teamId: e.target.value })}
                    className="field max-w-[13rem] flex-1"
                    aria-label={`${event.name} ${slot} place batch`}
                  >
                    <option value="">— not declared —</option>
                    {snapshot.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>

                  {event.individual && (
                    <input
                      value={placing?.athlete ?? ''}
                      onChange={(e) => setSlot(slot, { athlete: e.target.value })}
                      disabled={!placing?.teamId}
                      placeholder="Athlete name"
                      aria-label={`${event.name} ${slot} place athlete`}
                      className="field max-w-[15rem] flex-1 disabled:opacity-40"
                    />
                  )}

                  <span className="score text-[12px] whitespace-nowrap text-ink-muted">
                    +{event.overall[i]}
                    {event.individual ? ` · ind ${event.individual[i]}` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {event.individual && (
            <p className="mt-2.5 text-[11px] text-ink-muted">
              Overall points are credited to the batch either way. The athlete name is what puts a
              person on the individual championship table — spell it the same way every time so
              their events add up.
            </p>
          )}

          <p className="mt-6 font-display text-[10px] tracking-[0.24em] text-ink-muted uppercase">
            Fixture
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input
              value={fixture.date ?? ''}
              onChange={(e) => setFixture((f) => ({ ...f, date: e.target.value }))}
              placeholder="Date — e.g. 14 Feb"
              aria-label={`${event.name} date`}
              className="field"
            />
            <input
              value={fixture.time ?? ''}
              onChange={(e) => setFixture((f) => ({ ...f, time: e.target.value }))}
              placeholder="Time — e.g. 3:30 PM"
              aria-label={`${event.name} time`}
              className="field"
            />
            <input
              value={fixture.venue ?? ''}
              onChange={(e) => setFixture((f) => ({ ...f, venue: e.target.value }))}
              placeholder="Venue — e.g. Main Ground"
              aria-label={`${event.name} venue`}
              className="field"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button onClick={save} className="btn btn-crest">
              <Check size={14} /> Save
            </button>
            {stored && (
              <button onClick={clear} className="btn btn-ghost">
                <X size={14} /> Clear result
              </button>
            )}
            {saved && <span className="text-[12px] text-turf">Saved — totals recalculated.</span>}
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Batches ────────────────────────────────────────────────────────────────

function BatchesTab({ teams, actions }: { teams: Team[]; actions: Actions }) {
  return (
    <ul className="space-y-3">
      {teams.map((team) => (
        <li key={team.id} className="panel flex flex-wrap items-center gap-3 p-4">
          <TeamDot color={team.colorHex} size={12} />
          <input
            value={team.name}
            onChange={(e) => actions.updateTeam(team.id, { name: e.target.value })}
            aria-label={`${team.id} name`}
            className="field max-w-[14rem] flex-1"
          />
          <input
            value={team.short}
            onChange={(e) => actions.updateTeam(team.id, { short: e.target.value })}
            aria-label={`${team.id} short name`}
            className="field max-w-[6rem]"
          />
          <input
            type="color"
            value={team.colorHex}
            onChange={(e) => actions.updateTeam(team.id, { colorHex: e.target.value })}
            aria-label={`${team.id} colour`}
            className="h-9 w-12 cursor-pointer rounded border border-pitch-line bg-transparent"
          />
        </li>
      ))}
      <p className="pt-1 text-[12px] text-ink-muted">
        Renaming a batch is safe at any point — results reference the batch by id, not by name.
      </p>
    </ul>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────

function DataTab({ snapshot, actions }: { snapshot: Snapshot; actions: Actions }) {
  const [message, setMessage] = useState('');

  function exportJson() {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arangam-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    file
      .text()
      .then((text) => {
        const data = JSON.parse(text) as Partial<Snapshot>;
        // Replayed through the same actions the desk uses, so both backends
        // and every validation rule behave identically.
        for (const [eventId, result] of Object.entries(data.results ?? {})) {
          actions.setResult(eventId, result);
        }
        for (const [eventId, fixture] of Object.entries(data.fixtures ?? {})) {
          actions.setFixture(eventId, fixture);
        }
        for (const team of data.teams ?? []) {
          actions.updateTeam(team.id, { name: team.name, short: team.short, colorHex: team.colorHex });
        }
        setMessage(`Imported ${Object.keys(data.results ?? {}).length} results.`);
      })
      .catch(() => setMessage('That file could not be read as an Arangam export.'));
  }

  function reset() {
    if (!confirm('Clear every result and fixture? Batch names and colours are kept.')) return;
    actions.resetAll();
    setMessage('All results and fixtures cleared.');
  }

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <h2 className="font-display text-lg tracking-[0.06em] text-ink-primary uppercase">Backup</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          Results live in this browser unless a Convex deployment is configured. Export after each
          session so the record survives a cleared cache or a different device.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportJson} className="btn btn-ghost">
            <Download size={14} /> Export JSON
          </button>
          <label className="btn btn-ghost cursor-pointer">
            <Upload size={14} /> Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJson(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel border-clay/30 p-5">
        <h2 className="font-display text-lg tracking-[0.06em] text-ink-primary uppercase">
          Reset the meet
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          Removes every result and fixture. Export first — this cannot be undone.
        </p>
        <button
          onClick={reset}
          className="btn mt-4 border-clay/40 bg-clay/10 text-clay hover:bg-clay/20"
        >
          <Trash2 size={14} /> Clear all results
        </button>
      </section>

      {message && <p className="text-[13px] text-turf">{message}</p>}
    </div>
  );
}
