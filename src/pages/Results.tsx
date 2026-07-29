// src/pages/Results.tsx
import { useMemo, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import { CategoryTag, DisciplineTag, EmptyState, MedalBadge, TeamDot } from '../components/ui';
import { type Discipline } from '../data/catalog';
import { decidedEvents, teamColor, teamName } from '../data/standings';
import { useMeet } from '../hooks/useMeet';
import { SegmentedControl } from '../components/ui';

type Filter = 'all' | Discipline;

export default function Results() {
  const { snapshot, progress } = useMeet();
  const [filter, setFilter] = useState<Filter>('all');

  const decided = useMemo(
    () => decidedEvents(snapshot, filter === 'all' ? undefined : filter),
    [snapshot, filter],
  );

  return (
    <>
      <PageHeader
        eyebrow="Declared podiums"
        title="Results"
        subtitle={`${progress.decided} of ${progress.total} events have a declared result.`}
      >
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'game', label: 'Games' },
            { value: 'athletics', label: 'Athletics' },
          ]}
        />
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {decided.length === 0 ? (
          <EmptyState
            title="No results declared"
            hint="Podiums appear here the moment the results desk publishes them."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {decided.map(({ event, result }) => (
              <article key={event.id} className="panel flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <DisciplineTag discipline={event.discipline} />
                  <CategoryTag category={event.category} />
                </div>

                <h2 className="mt-3 font-display text-xl tracking-[0.05em] text-ink-primary uppercase">
                  {event.name}
                </h2>
                {event.note && <p className="mt-0.5 text-[11px] text-ink-muted">{event.note}</p>}

                <ol className="mt-4 flex-1 space-y-2.5">
                  {(['first', 'second', 'third'] as const).map((slot, i) => {
                    const placing = result[slot];
                    return (
                      <li key={slot} className="flex items-center gap-3">
                        <MedalBadge place={i as 0 | 1 | 2} size="sm" />
                        {placing ? (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <TeamDot color={teamColor(snapshot.teams, placing.teamId)} size={6} />
                              <span className="truncate text-[14px] text-ink-primary">
                                {teamName(snapshot.teams, placing.teamId)}
                              </span>
                            </div>
                            {placing.athlete && (
                              <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                                {placing.athlete}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="flex-1 text-[13px] text-pitch-line">Not declared</span>
                        )}
                        <span className="score shrink-0 text-[13px] text-ink-muted">
                          +{event.overall[i]}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
