// src/pages/Desk.tsx
// The results desk.
//   Results   — record who placed where; points follow from the programme.
//   Programme — rename, re-point, add and remove events.
//   Batches   — names and colours.
//   Data      — export, import, reset.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Download,
  ListPlus,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { MEET, categoryLabel, defaultProgramme, eventLabel } from '../data/catalog';
import { isSignedIn, signOut } from '../data/auth';
import { CategoryTag, MedalBadge, SegmentedControl, Tag, TeamDot } from '../components/ui';
import { useMeet, useMeetActions } from '../hooks/useMeet';
import type {
  Actions,
  Category,
  Discipline,
  EventResult,
  MeetEvent,
  Placing,
  Podium,
  Snapshot,
  Team,
} from '../data/types';

type Tab = 'results' | 'programme' | 'batches' | 'data';
const SLOTS = ['first', 'second', 'third'] as const;

const CATEGORIES: Category[] = ['men', 'women', 'mixed'];
const DISCIPLINES: Discipline[] = ['game', 'athletics'];

export default function Desk() {
  const navigate = useNavigate();
  const { snapshot, progress } = useMeet();
  const actions = useMeetActions();
  const [tab, setTab] = useState<Tab>('results');

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
          <p className="eyebrow">
            {MEET.name} {MEET.edition}
          </p>
          <h1 className="mt-2 font-display text-2xl tracking-[0.06em] text-ink-primary uppercase sm:text-3xl">
            Results Desk
          </h1>
          <p className="score mt-1.5 text-[12px] text-ink-muted">
            {progress.decided}/{progress.total} decided · {progress.pointsAwarded} points awarded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="btn btn-ghost no-underline">
            View site
          </Link>
          <button onClick={handleSignOut} className="btn btn-ghost">
            <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-1">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'results', label: 'Results' },
            { value: 'programme', label: 'Programme' },
            { value: 'batches', label: 'Batches' },
            { value: 'data', label: 'Data' },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === 'results' && <ResultsTab snapshot={snapshot} actions={actions} />}
        {tab === 'programme' && <ProgrammeTab snapshot={snapshot} actions={actions} />}
        {tab === 'batches' && <BatchesTab teams={snapshot.teams} actions={actions} />}
        {tab === 'data' && <DataTab snapshot={snapshot} actions={actions} />}
      </div>
    </div>
  );
}

// ─── Shared ─────────────────────────────────────────────────────────────────

function useSearch(events: MeetEvent[]) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      `${e.name} ${categoryLabel(e.category)} ${e.discipline}`.toLowerCase().includes(q),
    );
  }, [events, query]);
  return { query, setQuery, filtered };
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search
        size={15}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search events"
        className="field pl-9"
      />
    </div>
  );
}

/** Three number inputs for a 1st / 2nd / 3rd points triple. */
function PodiumInput({
  value,
  onChange,
  label,
}: {
  value: Podium;
  onChange: (podium: Podium) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {value.map((points, i) => (
        <input
          key={i}
          type="number"
          min={0}
          value={points}
          aria-label={`${label} ${['first', 'second', 'third'][i]} place points`}
          onChange={(e) => {
            const next = [...value] as Podium;
            next[i] = Math.max(0, Number(e.target.value) || 0);
            onChange(next);
          }}
          className="field score w-16 px-2 text-center"
        />
      ))}
    </div>
  );
}

// ─── Results ────────────────────────────────────────────────────────────────

function ResultsTab({ snapshot, actions }: { snapshot: Snapshot; actions: Actions }) {
  const { query, setQuery, filtered } = useSearch(snapshot.events);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <SearchBox value={query} onChange={setQuery} />

      <ul className="mt-4 space-y-2">
        {filtered.map((event) => (
          <ResultRow
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
        <p className="py-10 text-center text-[13px] text-ink-muted">Nothing matches “{query}”.</p>
      )}
    </>
  );
}

function ResultRow({
  event,
  snapshot,
  actions,
  open,
  onToggle,
}: {
  event: MeetEvent;
  snapshot: Snapshot;
  actions: Actions;
  open: boolean;
  onToggle: () => void;
}) {
  const stored = snapshot.results[event.id];
  const [podium, setPodium] = useState<EventResult>(stored ?? {});
  const [saved, setSaved] = useState(false);

  // Re-sync on open, so the row never shows a stale draft. Keyed on `open`
  // alone: saving replaces `stored` with an equal-but-new object, and
  // depending on it would wipe the confirmation the moment it appeared.
  const latest = useRef(stored);
  latest.current = stored;
  useEffect(() => {
    if (!open) return;
    setPodium(latest.current ?? {});
    setSaved(false);
  }, [open]);

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

  return (
    <li className="panel overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[15px] tracking-[0.04em] text-ink-primary">
            {event.name}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <CategoryTag category={event.category} />
            {stored ? <Tag tone="turf">Decided</Tag> : <Tag>Pending</Tag>}
          </span>
        </span>
        <span className="score shrink-0 text-[12px] text-ink-muted">{event.overall.join('/')}</span>
      </button>

      {open && (
        <div className="border-t border-pitch-line px-4 py-5">
          <div className="space-y-3">
            {SLOTS.map((slot, i) => {
              const placing = podium[slot];
              return (
                <div key={slot} className="flex flex-wrap items-center gap-2.5">
                  <MedalBadge place={i as 0 | 1 | 2} size="sm" />
                  <select
                    value={placing?.teamId ?? ''}
                    onChange={(e) => setSlot(slot, { teamId: e.target.value })}
                    className="field min-w-[10rem] flex-1"
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
                      value={placing?.person ?? ''}
                      onChange={(e) => setSlot(slot, { person: e.target.value })}
                      disabled={!placing?.teamId}
                      placeholder="Name"
                      aria-label={`${event.name} ${slot} place person`}
                      className="field min-w-[10rem] flex-1 disabled:opacity-40"
                    />
                  )}

                  {/* Fixed width so the selects line up down the podium */}
                  <span className="score w-16 shrink-0 text-right text-[12px] whitespace-nowrap text-ink-muted">
                    +{event.overall[i] ?? 0}
                    {event.individual ? ` · ${event.individual[i] ?? 0}i` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {event.individual && (
            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
              The name is what puts a person on the individual championship. Spell it the same way
              every time — their points add up across every event they place in.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                actions.setResult(event.id, podium);
                setSaved(true);
              }}
              className="btn btn-crest"
            >
              <Check size={14} /> Save
            </button>
            {stored && (
              <button
                onClick={() => {
                  actions.clearResult(event.id);
                  setPodium({});
                  setSaved(false);
                }}
                className="btn btn-ghost"
              >
                <X size={14} /> Clear
              </button>
            )}
            {saved && <span className="text-[12px] text-turf">Saved — totals recalculated.</span>}
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Programme ──────────────────────────────────────────────────────────────

const BLANK_EVENT: Omit<MeetEvent, 'id'> = {
  name: '',
  discipline: 'game',
  category: 'men',
  squad: '',
  overall: [10, 5, 2],
};

function ProgrammeTab({ snapshot, actions }: { snapshot: Snapshot; actions: Actions }) {
  const { query, setQuery, filtered } = useSearch(snapshot.events);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBox value={query} onChange={setQuery} />
        </div>
        <button onClick={() => setAdding((a) => !a)} className="btn btn-crest shrink-0">
          <Plus size={14} /> Add event
        </button>
      </div>

      {adding && (
        <NewEventForm
          taken={snapshot.events.length}
          onCancel={() => setAdding(false)}
          onCreate={(event) => {
            const id = actions.addEvent(event);
            setAdding(false);
            setOpenId(id);
          }}
        />
      )}

      <p className="mt-4 text-[12px] text-ink-muted">
        {snapshot.events.length} events on the programme. Editing an event's points re-scores every
        result already recorded against it.
      </p>

      <ul className="mt-3 space-y-2">
        {filtered.map((event) => (
          <ProgrammeRow
            key={event.id}
            event={event}
            decided={Boolean(snapshot.results[event.id])}
            actions={actions}
            open={openId === event.id}
            onToggle={() => setOpenId((id) => (id === event.id ? null : event.id))}
          />
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-[13px] text-ink-muted">Nothing matches “{query}”.</p>
      )}
    </>
  );
}

function NewEventForm({
  taken,
  onCreate,
  onCancel,
}: {
  taken: number;
  onCreate: (event: Omit<MeetEvent, 'id'>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Omit<MeetEvent, 'id'>>({ ...BLANK_EVENT });

  const valid = draft.name.trim().length > 0;

  return (
    <div className="panel mt-3 p-4 sm:p-5">
      <p className="eyebrow">New event · #{taken + 1}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
            Name
          </span>
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Kabaddi"
            className="field"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
            Players
          </span>
          <input
            value={draft.squad}
            onChange={(e) => setDraft((d) => ({ ...d, squad: e.target.value }))}
            placeholder="e.g. 7–12"
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
            Discipline
          </span>
          <select
            value={draft.discipline}
            onChange={(e) => setDraft((d) => ({ ...d, discipline: e.target.value as Discipline }))}
            className="field"
          >
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d === 'game' ? 'Game' : 'Athletics'}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
            Category
          </span>
          <select
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as Category }))}
            className="field"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          disabled={!valid}
          onClick={() => valid && onCreate({ ...draft, name: draft.name.trim() })}
          className="btn btn-crest disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ListPlus size={14} /> Create
        </button>
        <button onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
        <span className="text-[11px] text-ink-muted">
          Points and individual scoring are set on the next screen.
        </span>
      </div>
    </div>
  );
}

function ProgrammeRow({
  event,
  decided,
  actions,
  open,
  onToggle,
}: {
  event: MeetEvent;
  decided: boolean;
  actions: Actions;
  open: boolean;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState<MeetEvent>(event);
  const [saved, setSaved] = useState(false);

  // Keyed on `open` alone — see the note in ResultRow.
  const latest = useRef(event);
  latest.current = event;
  useEffect(() => {
    if (!open) return;
    setDraft(latest.current);
    setSaved(false);
  }, [open]);

  function patch(next: Partial<MeetEvent>) {
    setDraft((d) => ({ ...d, ...next }));
    setSaved(false);
  }

  function remove() {
    const warning = decided
      ? `Remove “${eventLabel(event)}”? Its recorded result goes with it and the standings will drop those points.`
      : `Remove “${eventLabel(event)}” from the programme?`;
    if (confirm(warning)) actions.removeEvent(event.id);
  }

  return (
    <li className="panel overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[15px] tracking-[0.04em] text-ink-primary">
            {event.name}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <CategoryTag category={event.category} />
            <Tag>{event.discipline === 'game' ? 'Game' : 'Athletics'}</Tag>
            {event.individual && <Tag tone="flood">Individual</Tag>}
            {decided && <Tag tone="turf">Decided</Tag>}
          </span>
        </span>
        <span className="score shrink-0 text-[12px] text-ink-muted">{event.overall.join('/')}</span>
      </button>

      {open && (
        <div className="border-t border-pitch-line px-4 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                Name
              </span>
              <input
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                className="field"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                Players
              </span>
              <input
                value={draft.squad}
                onChange={(e) => patch({ squad: e.target.value })}
                placeholder="e.g. 11–16"
                className="field"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                Discipline
              </span>
              <select
                value={draft.discipline}
                onChange={(e) => patch({ discipline: e.target.value as Discipline })}
                className="field"
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d === 'game' ? 'Game' : 'Athletics'}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                Category
              </span>
              <select
                value={draft.category}
                onChange={(e) => patch({ category: e.target.value as Category })}
                className="field"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                Format note
              </span>
              <input
                value={draft.note ?? ''}
                onChange={(e) => patch({ note: e.target.value })}
                placeholder="e.g. 2 singles & 1 double"
                className="field"
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="mb-2 font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
              Overall points — to the batch
            </p>
            <PodiumInput
              label={`${event.name} overall`}
              value={draft.overall}
              onChange={(overall) => patch({ overall })}
            />
          </div>

          <div className="mt-5">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={Boolean(draft.individual)}
                onChange={(e) => patch({ individual: e.target.checked ? [4, 3, 2] : undefined })}
                className="h-4 w-4 accent-[#D9A82E]"
              />
              <span className="font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                Counts towards the individual championship
              </span>
            </label>

            {draft.individual && (
              <div className="mt-3">
                <PodiumInput
                  label={`${event.name} individual`}
                  value={draft.individual}
                  onChange={(individual) => patch({ individual })}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                  The Results tab will ask for a name against each placing. One person can enter as
                  many events as they like — their points add up across all of them.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                actions.updateEvent(event.id, {
                  name: draft.name.trim() || event.name,
                  discipline: draft.discipline,
                  category: draft.category,
                  squad: draft.squad.trim(),
                  note: draft.note?.trim() || undefined,
                  overall: draft.overall,
                  individual: draft.individual,
                });
                setSaved(true);
              }}
              className="btn btn-crest"
            >
              <Check size={14} /> Save
            </button>
            <button
              onClick={remove}
              className="btn border-clay/40 bg-clay/10 text-clay hover:bg-clay/20"
            >
              <Trash2 size={14} /> Remove
            </button>
            {saved && <span className="text-[12px] text-turf">Saved.</span>}
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Batches ────────────────────────────────────────────────────────────────

function BatchesTab({ teams, actions }: { teams: Team[]; actions: Actions }) {
  return (
    <>
      <ul className="space-y-3">
        {teams.map((team) => (
          <li key={team.id} className="panel flex flex-wrap items-center gap-2.5 p-4">
            <TeamDot color={team.colorHex} size={12} />
            <input
              value={team.name}
              onChange={(e) => actions.updateTeam(team.id, { name: e.target.value })}
              aria-label={`${team.id} name`}
              className="field min-w-[9rem] flex-1"
            />
            <input
              value={team.short}
              onChange={(e) => actions.updateTeam(team.id, { short: e.target.value })}
              aria-label={`${team.id} short name`}
              className="field w-20 shrink-0"
            />
            <input
              type="color"
              value={team.colorHex}
              onChange={(e) => actions.updateTeam(team.id, { colorHex: e.target.value })}
              aria-label={`${team.id} colour`}
              className="h-9 w-12 shrink-0 cursor-pointer rounded border border-pitch-line bg-transparent"
            />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-ink-muted">
        Renaming a batch is safe at any point — results reference the batch by id, not by name.
      </p>
    </>
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
        // behave identically and every rule still applies.
        const known = new Set(snapshot.events.map((e) => e.id));
        for (const event of data.events ?? []) {
          if (known.has(event.id)) {
            const { id: _id, ...patch } = event;
            actions.updateEvent(event.id, patch);
          } else {
            actions.addEvent(event);
          }
        }
        for (const [eventId, result] of Object.entries(data.results ?? {})) {
          actions.setResult(eventId, result);
        }
        for (const team of data.teams ?? []) {
          actions.updateTeam(team.id, {
            name: team.name,
            short: team.short,
            colorHex: team.colorHex,
          });
        }
        setMessage(`Imported ${Object.keys(data.results ?? {}).length} results.`);
      })
      .catch(() => setMessage('That file could not be read as an Arangam export.'));
  }

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <h2 className="font-display text-lg tracking-[0.06em] text-ink-primary uppercase">Backup</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          The meet lives in this browser unless a Convex deployment is configured. Export after each
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

      <section className="panel p-5">
        <h2 className="font-display text-lg tracking-[0.06em] text-ink-primary uppercase">
          Restore the printed programme
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          Puts the {defaultProgramme().length} events from the official sheet back, discarding any
          edits to the programme. Results are kept — any whose event no longer exists simply stop
          counting.
        </p>
        <button
          onClick={() => {
            if (!confirm('Replace the programme with the printed sheet?')) return;
            actions.restoreProgramme();
            setMessage('Programme restored from the official sheet.');
          }}
          className="btn btn-ghost mt-4"
        >
          <RotateCcw size={14} /> Restore programme
        </button>
      </section>

      <section className="panel border-clay/30 p-5">
        <h2 className="font-display text-lg tracking-[0.06em] text-ink-primary uppercase">
          Clear all results
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          Removes every recorded podium and empties the standings. The programme and the batches
          stay. Export first — this cannot be undone.
        </p>
        <button
          onClick={() => {
            if (!confirm('Clear every recorded result?')) return;
            actions.resetResults();
            setMessage('All results cleared.');
          }}
          className="btn mt-4 border-clay/40 bg-clay/10 text-clay hover:bg-clay/20"
        >
          <Trash2 size={14} /> Clear results
        </button>
      </section>

      {message && <p className="text-[13px] text-turf">{message}</p>}
    </div>
  );
}
