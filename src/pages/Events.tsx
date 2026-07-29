// src/pages/Events.tsx
// The programme: every event with the points its placings carry. Cards on a
// phone, a single wide table from `md` up.

import { useMemo, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import { CategoryTag, PointsTriple, SegmentedControl, Tag } from '../components/ui';
import type { Discipline } from '../data/types';
import { useMeet } from '../hooks/useMeet';

type Filter = 'all' | Discipline;

export default function Events() {
  const { snapshot } = useMeet();
  const [filter, setFilter] = useState<Filter>('all');

  const games = snapshot.events.filter((e) => e.discipline === 'game');
  const athletics = snapshot.events.filter((e) => e.discipline === 'athletics');

  const events = useMemo(
    () =>
      filter === 'all' ? snapshot.events : snapshot.events.filter((e) => e.discipline === filter),
    [snapshot.events, filter],
  );

  return (
    <>
      <PageHeader
        eyebrow="The programme"
        title="Events & Points"
        subtitle={`${games.length} team games and ${athletics.length} athletics events. Overall points go to the batch; individual points are credited to the person and build the individual championship.`}
      >
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All ${snapshot.events.length}` },
            { value: 'game', label: `Games ${games.length}` },
            { value: 'athletics', label: `Athletics ${athletics.length}` },
          ]}
        />
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 flex flex-col gap-2 text-[12px] text-ink-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
          <span className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.2em] uppercase">Overall</span>
            <PointsTriple points={[10, 5, 2]} />
            <span>— to the batch</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.2em] uppercase">Individual</span>
            <PointsTriple points={[4, 3, 2]} />
            <span>— to the person</span>
          </span>
        </div>

        {/* Phone: one card per event */}
        <ul className="space-y-2.5 md:hidden">
          {events.map((event, i) => (
            <li key={event.id} className="panel p-4">
              <div className="flex items-start gap-3">
                <span className="score mt-0.5 text-[12px] text-ink-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[16px] tracking-[0.04em] text-ink-primary">
                    {event.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <CategoryTag category={event.category} />
                    <Tag>{event.discipline === 'game' ? 'Game' : 'Athletics'}</Tag>
                    {snapshot.results[event.id] && <Tag tone="turf">Decided</Tag>}
                  </div>
                  {event.note && <p className="mt-1.5 text-[11px] text-ink-muted">{event.note}</p>}
                </div>
              </div>

              <dl className="mt-3.5 grid grid-cols-3 gap-3 border-t border-pitch-line pt-3">
                <div>
                  <dt className="font-display text-[9px] tracking-[0.2em] text-ink-muted uppercase">
                    Players
                  </dt>
                  <dd className="score mt-1 text-[13px] text-ink-secondary">{event.squad}</dd>
                </div>
                <div>
                  <dt className="font-display text-[9px] tracking-[0.2em] text-ink-muted uppercase">
                    Overall
                  </dt>
                  <dd className="mt-1">
                    <PointsTriple points={event.overall} />
                  </dd>
                </div>
                <div>
                  <dt className="font-display text-[9px] tracking-[0.2em] text-ink-muted uppercase">
                    Individual
                  </dt>
                  <dd className="mt-1">
                    {event.individual ? (
                      <PointsTriple points={event.individual} />
                    ) : (
                      <span className="text-[13px] text-pitch-line">—</span>
                    )}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        {/* Tablet and up: the sheet as a table */}
        <div className="panel hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-pitch-line">
                {['#', 'Event', 'Players', 'Overall I / II / III', 'Individual I / II / III'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 font-display text-[10px] font-500 tracking-[0.22em] text-ink-muted uppercase"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => (
                <tr
                  key={event.id}
                  className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                >
                  <td className="score px-4 py-3 text-[12px] text-ink-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[15px] tracking-[0.04em] text-ink-primary">
                        {event.name}
                      </span>
                      <CategoryTag category={event.category} />
                      {snapshot.results[event.id] && <Tag tone="turf">Decided</Tag>}
                    </div>
                    {event.note && <p className="mt-1 text-[11px] text-ink-muted">{event.note}</p>}
                  </td>
                  <td className="score px-4 py-3 text-[13px] whitespace-nowrap text-ink-secondary">
                    {event.squad}
                  </td>
                  <td className="px-4 py-3">
                    <PointsTriple points={event.overall} />
                  </td>
                  <td className="px-4 py-3">
                    {event.individual ? (
                      <PointsTriple points={event.individual} />
                    ) : (
                      <span className="text-[13px] text-pitch-line">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <p className="py-12 text-center text-[13px] text-ink-muted">
            No events on the programme yet.
          </p>
        )}
      </section>
    </>
  );
}
