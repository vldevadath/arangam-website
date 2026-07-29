// src/pages/Standings.tsx
// The championship board. A podium strip for the shape of the race, a league
// table for the detail behind it, and the event-by-event ledger those totals
// are built from.

import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { CategoryTag, EmptyState, MEDALS, Tag, TeamDot } from '../components/ui';
import { eventLabel } from '../data/catalog';
import type { TeamStanding } from '../data/standings';
import { useMeet } from '../hooks/useMeet';

export default function Standings() {
  const { snapshot, teams, progress } = useMeet();

  const leader = teams[0];
  const leaderTotal = leader?.total ?? 0;
  const maxTotal = Math.max(1, leaderTotal);
  const scoringStarted = progress.decided > 0;
  const complete = progress.total > 0 && progress.decided === progress.total;

  /** Per-event points per batch — the ledger that adds up to each total. */
  const ledger = useMemo(
    () =>
      snapshot.events
        .filter((event) => snapshot.results[event.id])
        .map((event) => {
          const result = snapshot.results[event.id];
          const points: Record<string, number> = {};
          const places: Record<string, number> = {};
          (['first', 'second', 'third'] as const).forEach((slot, i) => {
            const placing = result[slot];
            if (placing?.teamId) {
              points[placing.teamId] = (points[placing.teamId] ?? 0) + (event.overall[i] ?? 0);
              places[placing.teamId] = i;
            }
          });
          return { event, points, places };
        }),
    [snapshot.events, snapshot.results],
  );

  return (
    <>
      <PageHeader
        eyebrow="Overall championship"
        title="Standings"
        subtitle={
          complete
            ? 'All events decided. Final standings.'
            : `${progress.decided} of ${progress.total} events decided · ${progress.pointsAwarded} points awarded so far.`
        }
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
        {!scoringStarted ? (
          <EmptyState
            title="The board is empty"
            hint="Standings build themselves as the results desk declares podiums. Until then, the programme and its points are on the events page."
          />
        ) : (
          <>
            {/* ── Podium ─────────────────────────────────────────────── */}
            <div className="grid gap-3 md:grid-cols-3">
              {teams.slice(0, 3).map((team, i) => (
                <PodiumCard
                  key={team.id}
                  team={team}
                  place={i as 0 | 1 | 2}
                  gap={leaderTotal - team.total}
                  complete={complete}
                />
              ))}
            </div>

            {/* ── League table ───────────────────────────────────────── */}
            <div className="mt-10 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl tracking-[0.08em] text-ink-primary uppercase sm:text-2xl">
                Full table
              </h2>
              <p className="font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                All {teams.length} batches
              </p>
            </div>

            {/* Desktop: a dense, aligned league table */}
            <div className="panel mt-4 hidden overflow-hidden md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-pitch-line bg-pitch-base/40">
                    <Th className="w-14 text-center">Pos</Th>
                    <Th>Batch</Th>
                    <Th className="text-right">Games</Th>
                    <Th className="text-right">Athletics</Th>
                    <Th className="w-12 text-center" title="First places">
                      <span style={{ color: MEDALS[0].text }}>1st</span>
                    </Th>
                    <Th className="w-12 text-center" title="Second places">
                      <span style={{ color: MEDALS[1].text }}>2nd</span>
                    </Th>
                    <Th className="w-12 text-center" title="Third places">
                      <span style={{ color: MEDALS[2].text }}>3rd</span>
                    </Th>
                    <Th className="w-16 text-right">Podiums</Th>
                    <Th className="w-16 text-right">Gap</Th>
                    <Th className="w-20 text-right">Points</Th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const podiums = team.golds + team.silvers + team.bronzes;
                    const gap = leaderTotal - team.total;
                    const first = team.rank === 1;
                    return (
                      <tr
                        key={team.id}
                        className="relative border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.03]"
                        style={first ? { background: 'rgb(247 206 91 / 0.045)' } : undefined}
                      >
                        <td className="relative py-3.5 pr-2 pl-4 text-center">
                          {/* Rank rail — gold for the leader, batch colour below */}
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 w-[3px]"
                            style={{ background: first ? MEDALS[0].text : team.colorHex, opacity: first ? 1 : 0.5 }}
                          />
                          <span className="score text-[15px] text-ink-primary">{team.rank}</span>
                        </td>

                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <TeamDot color={team.colorHex} />
                            <span className="font-display text-[16px] tracking-[0.04em] text-ink-primary">
                              {team.name}
                            </span>
                            {first && <Tag tone="crest">{complete ? 'Champions' : 'Leading'}</Tag>}
                          </div>
                          {/* Share of the leader's points */}
                          <div className="mt-2 h-[3px] w-40 overflow-hidden rounded-full bg-pitch-line">
                            <div
                              className="h-full rounded-full transition-[width] duration-700"
                              style={{
                                width: `${(team.total / maxTotal) * 100}%`,
                                background: team.colorHex,
                              }}
                            />
                          </div>
                        </td>

                        <td className="score py-3.5 pr-4 text-right text-[14px] text-ink-secondary">
                          {team.gamePoints}
                        </td>
                        <td className="score py-3.5 pr-4 text-right text-[14px] text-ink-secondary">
                          {team.athleticsPoints}
                        </td>

                        <MedalCell count={team.golds} place={0} />
                        <MedalCell count={team.silvers} place={1} />
                        <MedalCell count={team.bronzes} place={2} />

                        <td className="score py-3.5 pr-4 text-right text-[14px] text-ink-secondary">
                          {podiums}
                        </td>
                        <td className="score py-3.5 pr-4 text-right text-[13px] text-ink-muted">
                          {gap === 0 ? '—' : `−${gap}`}
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <span
                            className="score text-[22px]"
                            style={{ color: first ? MEDALS[0].text : 'var(--color-ink-primary)' }}
                          >
                            {team.total}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same table as stacked rows */}
            <ul className="mt-4 space-y-2.5 md:hidden">
              {teams.map((team) => {
                const gap = leaderTotal - team.total;
                const first = team.rank === 1;
                return (
                  <li key={team.id} className="panel relative overflow-hidden p-4">
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ background: first ? MEDALS[0].text : team.colorHex, opacity: first ? 1 : 0.5 }}
                    />
                    <div className="flex items-center gap-3">
                      <span className="score w-5 shrink-0 text-center text-[15px] text-ink-primary">
                        {team.rank}
                      </span>
                      <TeamDot color={team.colorHex} />
                      <span className="min-w-0 flex-1 truncate font-display text-[17px] tracking-[0.04em] text-ink-primary">
                        {team.name}
                      </span>
                      <span
                        className="score shrink-0 text-[22px]"
                        style={{ color: first ? MEDALS[0].text : 'var(--color-ink-primary)' }}
                      >
                        {team.total}
                      </span>
                    </div>

                    <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-pitch-line">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${(team.total / maxTotal) * 100}%`, background: team.colorHex }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
                      <span>
                        Games <span className="score text-ink-secondary">{team.gamePoints}</span>
                      </span>
                      <span>
                        Athletics{' '}
                        <span className="score text-ink-secondary">{team.athleticsPoints}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {[team.golds, team.silvers, team.bronzes].map((count, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: MEDALS[i].text, opacity: count ? 1 : 0.2 }}
                            />
                            <span className="score text-ink-secondary">{count}</span>
                          </span>
                        ))}
                      </span>
                      <span>Gap <span className="score text-ink-secondary">{gap === 0 ? '—' : `−${gap}`}</span></span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ── Ledger ─────────────────────────────────────────────── */}
            <div className="mt-12 flex items-baseline justify-between gap-4 sm:mt-14">
              <h2 className="font-display text-xl tracking-[0.08em] text-ink-primary uppercase sm:text-2xl">
                Points ledger
              </h2>
              <p className="font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                {ledger.length} decided
              </p>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              Every point above, traced back to the event that awarded it.
            </p>

            <div className="panel mt-4 hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-pitch-line bg-pitch-base/40">
                    <Th>Event</Th>
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
                  {ledger.map(({ event, points, places }) => (
                    <tr
                      key={event.id}
                      className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                    >
                      <td className="py-2.5 pr-4 pl-4">
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] whitespace-nowrap text-ink-secondary">
                            {eventLabel(event)}
                          </span>
                          {event.individual && <Tag tone="flood">Ind</Tag>}
                        </span>
                      </td>
                      {teams.map((team) => {
                        const gained = points[team.id];
                        const place = places[team.id];
                        return (
                          <td key={team.id} className="score px-3 py-2.5 text-center text-[13px]">
                            {gained ? (
                              <span style={{ color: MEDALS[place]?.text }}>{gained}</span>
                            ) : (
                              <span className="text-pitch-line">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-pitch-line bg-pitch-base/50">
                    <td className="py-3 pr-4 pl-4 font-display text-[11px] tracking-[0.2em] text-ink-muted uppercase">
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

            {/* Mobile ledger: only the batches that actually scored */}
            <ul className="mt-4 space-y-2.5 md:hidden">
              {ledger.map(({ event, points, places }) => (
                <li key={event.id} className="panel p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] text-ink-primary">{eventLabel(event)}</span>
                    <CategoryTag category={event.category} />
                  </div>
                  <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {teams
                      .filter((team) => points[team.id])
                      .map((team) => (
                        <li key={team.id} className="flex items-center gap-1.5">
                          <TeamDot color={team.colorHex} size={6} />
                          <span className="text-[12px] text-ink-secondary">{team.short}</span>
                          <span
                            className="score text-[13px]"
                            style={{ color: MEDALS[places[team.id]]?.text }}
                          >
                            +{points[team.id]}
                          </span>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[12px] text-ink-muted">
              Colour marks the placing: <span style={{ color: MEDALS[0].text }}>first</span>,{' '}
              <span style={{ color: MEDALS[1].text }}>second</span>,{' '}
              <span style={{ color: MEDALS[2].text }}>third</span>. Totals are derived from the
              declared podiums, so a corrected result re-scores the board immediately.
            </p>
          </>
        )}
      </section>
    </>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────────────

function Th({
  children,
  className = '',
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <th
      title={title}
      className={`px-4 py-3 font-display text-[10px] font-500 tracking-[0.2em] text-ink-muted uppercase ${className}`}
    >
      {children}
    </th>
  );
}

function MedalCell({ count, place }: { count: number; place: 0 | 1 | 2 }) {
  return (
    <td className="score py-3.5 text-center text-[14px]">
      <span style={{ color: count ? MEDALS[place].text : 'var(--color-pitch-line)' }}>{count}</span>
    </td>
  );
}

function PodiumCard({
  team,
  place,
  gap,
  complete,
}: {
  team: TeamStanding;
  place: 0 | 1 | 2;
  gap: number;
  complete: boolean;
}) {
  const medal = MEDALS[place];
  const first = place === 0;

  return (
    <article
      className="panel relative overflow-hidden p-5"
      style={{ borderColor: first ? 'rgb(247 206 91 / 0.34)' : undefined }}
    >
      {/* Medal-coloured cap */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${medal.text}, transparent)` }}
      />
      {first && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-14 h-48 w-48 rounded-full bg-crest/12 blur-3xl"
        />
      )}

      <div className="relative flex items-center justify-between gap-3">
        <span
          className="grid h-9 w-9 place-items-center rounded-full border font-display text-[11px] font-600"
          style={{ borderColor: medal.ring, background: medal.fill, color: medal.text }}
        >
          {medal.label}
        </span>
        {first ? (
          <span className="flex items-center gap-1.5 font-display text-[10px] tracking-[0.24em] text-crest uppercase">
            <Trophy size={13} />
            {complete ? 'Champions' : 'Leading'}
          </span>
        ) : (
          <span className="score text-[11px] text-ink-muted">−{gap} pts</span>
        )}
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TeamDot color={team.colorHex} />
            <p className="truncate font-display text-xl tracking-[0.04em] text-ink-primary uppercase">
              {team.name}
            </p>
          </div>
          <p className="score mt-1.5 text-[11px] text-ink-muted">
            {team.golds}G · {team.silvers}S · {team.bronzes}B
          </p>
        </div>
        <p
          className={`score shrink-0 leading-none ${first ? 'text-4xl' : 'text-3xl'}`}
          style={{ color: medal.text }}
        >
          {team.total}
        </p>
      </div>
    </article>
  );
}
