// src/pages/Standings.tsx
// Where every batch's total comes from: games versus athletics, medals, and
// the event-by-event ledger behind the number.

import { useMemo } from 'react';
import PageHeader from '../components/layout/PageHeader';
import { EmptyState, MEDALS, TeamDot } from '../components/ui';
import { eventLabel } from '../data/catalog';
import { useMeet } from '../hooks/useMeet';

export default function Standings() {
  const { snapshot, teams, progress } = useMeet();
  const maxTotal = Math.max(1, teams[0]?.total ?? 1);

  /** Per-event points per batch — the ledger that adds up to each total. */
  const ledger = useMemo(
    () =>
      snapshot.events
        .filter((event) => snapshot.results[event.id])
        .map((event) => {
          const result = snapshot.results[event.id];
          const points: Record<string, number> = {};
          (['first', 'second', 'third'] as const).forEach((slot, i) => {
            const placing = result[slot];
            if (placing?.teamId) {
              points[placing.teamId] = (points[placing.teamId] ?? 0) + (event.overall[i] ?? 0);
            }
          });
          return { event, points };
        }),
    [snapshot.events, snapshot.results],
  );

  return (
    <>
      <PageHeader
        eyebrow="Overall championship"
        title="Standings"
        subtitle={`${progress.decided} of ${progress.total} events decided · ${progress.pointsAwarded} points awarded so far.`}
      >
        <div className="max-w-md">
          <div className="h-1.5 overflow-hidden rounded-full bg-pitch-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-crest-dim to-crest-bright transition-[width] duration-700"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="score mt-2 text-[11px] text-ink-muted">
            {progress.percent}% of the meet complete
          </p>
        </div>
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <article key={team.id} className="panel relative overflow-hidden p-4 sm:p-5">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: team.colorHex, opacity: 0.7 }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TeamDot color={team.colorHex} />
                    <span className="score text-[11px] text-ink-muted">Rank {team.rank}</span>
                  </div>
                  <p className="mt-1.5 truncate font-display text-xl tracking-[0.04em] text-ink-primary uppercase">
                    {team.name}
                  </p>
                </div>
                <p className="score shrink-0 text-3xl" style={{ color: team.colorHex }}>
                  {team.total}
                </p>
              </div>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-pitch-line">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${(team.total / maxTotal) * 100}%`, background: team.colorHex }}
                />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <dt className="font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                    Games
                  </dt>
                  <dd className="score mt-0.5 text-ink-secondary">{team.gamePoints}</dd>
                </div>
                <div>
                  <dt className="font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                    Athletics
                  </dt>
                  <dd className="score mt-0.5 text-ink-secondary">{team.athleticsPoints}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center gap-4 border-t border-pitch-line pt-3">
                {[team.golds, team.silvers, team.bronzes].map((count, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: MEDALS[i].text, opacity: count ? 1 : 0.25 }}
                    />
                    <span className="score text-[13px] text-ink-secondary">{count}</span>
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <h2 className="mt-12 font-display text-2xl tracking-[0.06em] text-ink-primary uppercase sm:mt-14">
          Points ledger
        </h2>
        <p className="mt-1.5 text-[13px] text-ink-muted">
          Overall points contributed by each decided event.
        </p>

        {ledger.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Nothing on the ledger yet"
              hint="Once the results desk publishes a podium, the points it awarded appear here."
            />
          </div>
        ) : (
          <>
            {/* Phone: per-event card listing only the batches that scored */}
            <ul className="mt-5 space-y-2.5 md:hidden">
              {ledger.map(({ event, points }) => (
                <li key={event.id} className="panel p-4">
                  <p className="text-[14px] text-ink-primary">{eventLabel(event)}</p>
                  <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {teams
                      .filter((team) => points[team.id])
                      .map((team) => (
                        <li key={team.id} className="flex items-center gap-1.5">
                          <TeamDot color={team.colorHex} size={6} />
                          <span className="text-[12px] text-ink-secondary">{team.short}</span>
                          <span className="score text-[13px] text-ink-primary">
                            +{points[team.id]}
                          </span>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>

            <div className="panel mt-5 hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-pitch-line">
                    <th className="px-4 py-3 font-display text-[10px] font-500 tracking-[0.22em] text-ink-muted uppercase">
                      Event
                    </th>
                    {teams.map((team) => (
                      <th key={team.id} className="px-3 py-3 text-center">
                        <span className="flex items-center justify-center gap-1.5">
                          <TeamDot color={team.colorHex} size={6} />
                          <span className="font-display text-[10px] font-500 tracking-[0.16em] text-ink-muted uppercase">
                            {team.short}
                          </span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.map(({ event, points }) => (
                    <tr
                      key={event.id}
                      className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-2.5 text-[13px] whitespace-nowrap text-ink-secondary">
                        {eventLabel(event)}
                      </td>
                      {teams.map((team) => (
                        <td key={team.id} className="score px-3 py-2.5 text-center text-[13px]">
                          {points[team.id] ? (
                            <span className="text-ink-primary">{points[team.id]}</span>
                          ) : (
                            <span className="text-pitch-line">·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-pitch-line bg-pitch-base/40">
                    <td className="px-4 py-3 font-display text-[11px] tracking-[0.2em] text-ink-muted uppercase">
                      Total
                    </td>
                    {teams.map((team) => (
                      <td key={team.id} className="score px-3 py-3 text-center text-[15px]">
                        <span style={{ color: team.colorHex }}>{team.total}</span>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
