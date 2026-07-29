// src/pages/Events.tsx
// The official programme: every event with the points its placings carry, plus
// whatever schedule the results desk has published.

import { useMemo, useState } from 'react';
import { CalendarClock, MapPin } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { CategoryTag, PointsTriple, SegmentedControl, Tag } from '../components/ui';
import { ALL_EVENTS, ATHLETICS, GAMES, type Discipline } from '../data/catalog';
import { useMeet } from '../hooks/useMeet';

type Filter = 'all' | Discipline;

export default function Events() {
  const { snapshot } = useMeet();
  const [filter, setFilter] = useState<Filter>('all');

  const events = useMemo(
    () => (filter === 'all' ? ALL_EVENTS : ALL_EVENTS.filter((e) => e.discipline === filter)),
    [filter],
  );

  return (
    <>
      <PageHeader
        eyebrow="The programme"
        title="Events & Points"
        subtitle={`${GAMES.length} team games and ${ATHLETICS.length} athletics events. Overall points go to the batch; individual points count only in athletics, towards the individual championship.`}
      >
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All ${ALL_EVENTS.length}` },
            { value: 'game', label: `Games ${GAMES.length}` },
            { value: 'athletics', label: `Athletics ${ATHLETICS.length}` },
          ]}
        />
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Legend */}
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.2em] uppercase">Overall</span>
            <PointsTriple points={[10, 5, 2]} />
            <span>— added to the batch total</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-display text-[10px] tracking-[0.2em] uppercase">Individual</span>
            <PointsTriple points={[4, 3, 2]} />
            <span>— credited to the athlete</span>
          </span>
        </div>

        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-pitch-line">
                {['#', 'Event', 'Players', 'Overall I / II / III', 'Individual I / II / III', 'Schedule'].map(
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
              {events.map((event, i) => {
                const fixture = snapshot.fixtures[event.id];
                const decided = Boolean(snapshot.results[event.id]);
                return (
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
                        {decided && <Tag tone="turf">Decided</Tag>}
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
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap text-ink-muted">
                      {fixture ? (
                        <span className="flex flex-col gap-0.5">
                          {(fixture.date || fixture.time) && (
                            <span className="flex items-center gap-1.5">
                              <CalendarClock size={12} className="text-crest-dim" />
                              {[fixture.date, fixture.time].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {fixture.venue && (
                            <span className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-crest-dim" />
                              {fixture.venue}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-pitch-line">To be announced</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[12px] text-ink-muted">
          Relays carry {''}
          <span className="score text-ink-secondary">10 / 5 / 3</span> overall; all other athletics
          events carry <span className="score text-ink-secondary">5 / 3 / 1</span>. Every team game
          carries <span className="score text-ink-secondary">10 / 5 / 2</span>.
        </p>
      </section>
    </>
  );
}
