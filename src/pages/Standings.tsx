// src/pages/Standings.tsx
// Five point tables, one page:
//
//   Overall            games points plus the athletics bonus; the championship
//   Games              points as won, straight into the overall total
//   Athletics · Men    decides 10 / 6 / 2 towards the overall total
//   Athletics · Women  likewise
//   Athletics          every athletics event, mixed included — the full picture
//
// Each view ranks on its own points and traces them back through a ledger of
// only its own events.

import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { CategoryTag, EmptyState, MEDALS, SegmentedControl, Tag, TeamDot } from '../components/ui';
import { eventLabel } from '../data/catalog';
import {
  ATHLETICS_CHAMPION_POINTS,
  athleticsComplete,
  athleticsStandings,
  categoryWeight,
  formatPoints,
  gamesStandings,
  type TeamStanding,
} from '../data/standings';
import type { MeetEvent } from '../data/types';
import { useMeet } from '../hooks/useMeet';

type View = 'overall' | 'games' | 'ath-men' | 'ath-women' | 'ath-all';

const VIEWS: ReadonlyArray<{ value: View; label: string; eyebrow: string; blurb: string }> = [
  {
    value: 'overall',
    label: 'Overall',
    eyebrow: 'Overall championship',
    blurb: 'Games points as won, plus the 10 / 6 / 2 earned for topping the athletics tables.',
  },
  {
    value: 'games',
    label: 'Games',
    eyebrow: 'Games championship',
    blurb: 'Points as won, event by event. These carry straight into the overall championship.',
  },
  {
    value: 'ath-men',
    label: 'Ath · Men',
    eyebrow: "Athletics · Men's championship",
    blurb: "Men's athletics only. The top three carry 10 / 6 / 2 into the overall championship.",
  },
  {
    value: 'ath-women',
    label: 'Ath · Women',
    eyebrow: "Athletics · Women's championship",
    blurb: "Women's athletics only. The top three carry 10 / 6 / 2 into the overall championship.",
  },
  {
    value: 'ath-all',
    label: 'Athletics',
    eyebrow: 'Athletics championship',
    blurb:
      'Every athletics event, mixed included. Shown for the full picture — the overall championship is fed by the men’s and women’s tables, not by this one.',
  },
];

/** The two views whose ranking hands out the athletics bonus. */
const AWARDS_BONUS: View[] = ['ath-men', 'ath-women'];

export default function Standings() {
  const { snapshot, teams, progress } = useMeet();
  const [view, setView] = useState<View>('overall');

  const games = useMemo(() => gamesStandings(snapshot), [snapshot]);
  const athAll = useMemo(() => athleticsStandings(snapshot), [snapshot]);
  const athMen = useMemo(() => athleticsStandings(snapshot, 'men'), [snapshot]);
  const athWomen = useMemo(() => athleticsStandings(snapshot, 'women'), [snapshot]);
  const trackDone = useMemo(() => athleticsComplete(snapshot), [snapshot]);

  const meta = VIEWS.find((v) => v.value === view)!;
  const awardsBonus = AWARDS_BONUS.includes(view);

  const rows =
    view === 'games'
      ? games
      : view === 'ath-men'
        ? athMen
        : view === 'ath-women'
          ? athWomen
          : view === 'ath-all'
            ? athAll
            : teams;

  const leaderTotal = rows[0]?.total ?? 0;
  const scoringStarted = rows.some((r) => r.total > 0);
  const meetComplete = progress.total > 0 && progress.decided === progress.total;
  // Games only settles with the whole meet; the athletics tables settle when
  // athletics does.
  const settled = view === 'overall' || view === 'games' ? meetComplete : trackDone;

  /** Which events feed the table on screen. */
  const accepts = useMemo(() => {
    const byView: Record<View, (e: MeetEvent) => boolean> = {
      games: (e) => e.discipline === 'game',
      // Mixed feeds both gendered tables at half, so it belongs in both ledgers.
      'ath-men': (e) => e.discipline === 'athletics' && categoryWeight(e, 'men') > 0,
      'ath-women': (e) => e.discipline === 'athletics' && categoryWeight(e, 'women') > 0,
      'ath-all': (e) => e.discipline === 'athletics',
      overall: () => true,
    };
    return byView[view];
  }, [view]);

  /** Per-event points per batch — the ledger that adds up to each total. */
  const ledger = useMemo(() => {
    const category = view === 'ath-men' ? 'men' : view === 'ath-women' ? 'women' : undefined;
    return snapshot.events
      .filter(accepts)
      .filter((event) => snapshot.results[event.id])
      .map((event) => {
        const result = snapshot.results[event.id];
        // Half a mixed placing on a gendered table, whole everywhere else.
        const weight = category ? categoryWeight(event, category) : 1;
        const points: Record<string, number> = {};
        const places: Record<string, number> = {};
        (['first', 'second', 'third'] as const).forEach((slot, i) => {
          const placing = result[slot];
          if (placing?.teamId) {
            points[placing.teamId] =
              (points[placing.teamId] ?? 0) + (event.overall[i] ?? 0) * weight;
            places[placing.teamId] = i;
          }
        });
        return { event, points, places, split: weight !== 1 };
      });
  }, [snapshot.events, snapshot.results, accepts, view]);

  return (
    <>
      <PageHeader eyebrow={meta.eyebrow} title="Standings" subtitle={meta.blurb}>
        <div className="max-w-md">
          <div className="h-1.5 overflow-hidden rounded-full bg-pitch-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-crest-dim to-crest-bright transition-[width] duration-700"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="score mt-2 text-[11px] text-ink-muted">
            {progress.decided} of {progress.total} events decided · {progress.percent}%
          </p>
        </div>

        <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <SegmentedControl
            value={view}
            onChange={setView}
            options={VIEWS.map(({ value, label }) => ({ value, label }))}
          />
        </div>
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {!scoringStarted ? (
          <EmptyState
            title="Nothing on this table yet"
            hint="Standings build themselves as the results desk declares podiums. Until then, the programme and its points are on the events page."
          />
        ) : (
          <>
            {/* ── Podium ─────────────────────────────────────────────── */}
            <div className="grid gap-3 md:grid-cols-3">
              {rows.slice(0, 3).map((team, i) => (
                <PodiumCard
                  key={team.id}
                  team={team}
                  place={i as 0 | 1 | 2}
                  gap={leaderTotal - team.total}
                  settled={settled}
                  bonus={awardsBonus ? ATHLETICS_CHAMPION_POINTS[i] : undefined}
                  bonusAwarded={trackDone}
                />
              ))}
            </div>

            {awardsBonus && !trackDone && (
              <p className="mt-4 inline-flex rounded-md border border-crest/25 bg-crest/8 px-3 py-2 text-[12px] text-crest-bright">
                Provisional — the 10 / 6 / 2 counts once every athletics event is decided.
              </p>
            )}

            {/* ── Full table ─────────────────────────────────────────── */}
            <div className="mt-10 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl tracking-[0.08em] text-ink-primary uppercase sm:text-2xl">
                Full table
              </h2>
              <p className="font-display text-[10px] tracking-[0.2em] text-ink-muted uppercase">
                All {rows.length} batches
              </p>
            </div>

            {/* Desktop */}
            <div className="panel mt-4 hidden overflow-hidden md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-pitch-line bg-pitch-base/40">
                    <Th className="w-14 text-center">Pos</Th>
                    <Th>Batch</Th>
                    {view === 'overall' && <Th className="text-right">Games</Th>}
                    {view === 'overall' && (
                      <Th className="text-right" title="Earned for topping the athletics tables">
                        Athletics
                      </Th>
                    )}
                    <Th className="w-12 text-center">
                      <span style={{ color: MEDALS[0].text }}>1st</span>
                    </Th>
                    <Th className="w-12 text-center">
                      <span style={{ color: MEDALS[1].text }}>2nd</span>
                    </Th>
                    <Th className="w-12 text-center">
                      <span style={{ color: MEDALS[2].text }}>3rd</span>
                    </Th>
                    <Th className="w-16 text-right">Podiums</Th>
                    <Th className="w-16 text-right">Gap</Th>
                    {awardsBonus && <Th className="w-16 text-right">Bonus</Th>}
                    <Th className="w-20 text-right">Points</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((team) => {
                    const podiums = team.golds + team.silvers + team.bronzes;
                    const gap = leaderTotal - team.total;
                    const first = team.rank === 1;
                    const bonus =
                      awardsBonus && team.total > 0
                        ? ATHLETICS_CHAMPION_POINTS[team.rank - 1]
                        : undefined;
                    return (
                      <tr
                        key={team.id}
                        className="relative border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.03]"
                        style={first ? { background: 'rgb(247 206 91 / 0.045)' } : undefined}
                      >
                        <td className="relative py-3.5 pr-2 pl-4 text-center">
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 w-[3px]"
                            style={{
                              background: first ? MEDALS[0].text : team.colorHex,
                              opacity: first ? 1 : 0.5,
                            }}
                          />
                          <span className="score text-[15px] text-ink-primary">{team.rank}</span>
                        </td>

                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <TeamDot color={team.colorHex} />
                            <span className="font-display text-[16px] tracking-[0.04em] text-ink-primary">
                              {team.name}
                            </span>
                            {first && <Tag tone="crest">{settled ? 'Champions' : 'Leading'}</Tag>}
                          </div>
                          <div className="mt-2 h-[3px] w-40 overflow-hidden rounded-full bg-pitch-line">
                            <div
                              className="h-full rounded-full transition-[width] duration-700"
                              style={{
                                width: `${(team.total / Math.max(1, leaderTotal)) * 100}%`,
                                background: team.colorHex,
                              }}
                            />
                          </div>
                        </td>

                        {view === 'overall' && (
                          <td className="score py-3.5 pr-4 text-right text-[14px] text-ink-secondary">
                            {team.gamePoints}
                          </td>
                        )}
                        {view === 'overall' && (
                          <td className="score py-3.5 pr-4 text-right text-[14px]">
                            {team.athleticsBonus > 0 ? (
                              <span className="text-crest-bright">+{team.athleticsBonus}</span>
                            ) : (
                              <span className="text-pitch-line">{trackDone ? '—' : '·'}</span>
                            )}
                          </td>
                        )}

                        <MedalCell count={team.golds} place={0} />
                        <MedalCell count={team.silvers} place={1} />
                        <MedalCell count={team.bronzes} place={2} />

                        <td className="score py-3.5 pr-4 text-right text-[14px] text-ink-secondary">
                          {podiums}
                        </td>
                        <td className="score py-3.5 pr-4 text-right text-[13px] text-ink-muted">
                          {gap === 0 ? '—' : `−${formatPoints(gap)}`}
                        </td>

                        {awardsBonus && (
                          <td className="score py-3.5 pr-4 text-right text-[14px]">
                            {bonus ? (
                              <span
                                style={{
                                  color: trackDone
                                    ? MEDALS[team.rank - 1]?.text
                                    : 'var(--color-ink-muted)',
                                }}
                              >
                                +{bonus}
                              </span>
                            ) : (
                              <span className="text-pitch-line">—</span>
                            )}
                          </td>
                        )}

                        <td className="py-3.5 pr-4 text-right">
                          <span
                            className="score text-[22px]"
                            style={{ color: first ? MEDALS[0].text : 'var(--color-ink-primary)' }}
                          >
                            {formatPoints(team.total)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="mt-4 space-y-2.5 md:hidden">
              {rows.map((team) => {
                const gap = leaderTotal - team.total;
                const first = team.rank === 1;
                const bonus =
                  awardsBonus && team.total > 0
                    ? ATHLETICS_CHAMPION_POINTS[team.rank - 1]
                    : undefined;
                return (
                  <li key={team.id} className="panel relative overflow-hidden p-4">
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{
                        background: first ? MEDALS[0].text : team.colorHex,
                        opacity: first ? 1 : 0.5,
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <span className="score w-5 shrink-0 text-center text-[15px] text-ink-primary">
                        {team.rank}
                      </span>
                      <TeamDot color={team.colorHex} />
                      <span className="min-w-0 flex-1 truncate font-display text-[17px] tracking-[0.04em] text-ink-primary">
                        {team.name}
                      </span>
                      {bonus && (
                        <span
                          className="score shrink-0 text-[13px]"
                          style={{
                            color: trackDone
                              ? MEDALS[team.rank - 1]?.text
                              : 'var(--color-ink-muted)',
                          }}
                        >
                          +{bonus}
                        </span>
                      )}
                      <span
                        className="score shrink-0 text-[22px]"
                        style={{ color: first ? MEDALS[0].text : 'var(--color-ink-primary)' }}
                      >
                        {formatPoints(team.total)}
                      </span>
                    </div>

                    <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-pitch-line">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${(team.total / Math.max(1, leaderTotal)) * 100}%`,
                          background: team.colorHex,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
                      {view === 'overall' && (
                        <>
                          <span>
                            Games <span className="score text-ink-secondary">{team.gamePoints}</span>
                          </span>
                          <span>
                            Athletics{' '}
                            <span className="score text-crest-bright">
                              {team.athleticsBonus > 0 ? `+${team.athleticsBonus}` : '—'}
                            </span>
                          </span>
                        </>
                      )}
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
                      <span>
                        Gap{' '}
                        <span className="score text-ink-secondary">
                          {gap === 0 ? '—' : `−${formatPoints(gap)}`}
                        </span>
                      </span>
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
              Every point on this table, traced back to the event that awarded it.
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
                <div className="panel mt-5 hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-pitch-line bg-pitch-base/40">
                        <Th>Event</Th>
                        {rows.map((team) => (
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
                      {ledger.map(({ event, points, places, split }) => (
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
                              {split && <Tag tone="turf">Split</Tag>}
                            </span>
                          </td>
                          {rows.map((team) => {
                            const gained = points[team.id];
                            return (
                              <td
                                key={team.id}
                                className="score px-3 py-2.5 text-center text-[13px]"
                              >
                                {gained ? (
                                  <span style={{ color: MEDALS[places[team.id]]?.text }}>
                                    {formatPoints(gained)}
                                  </span>
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
                          Points won
                        </td>
                        {rows.map((team) => (
                          <td key={team.id} className="score px-3 py-3 text-center text-[15px]">
                            <span style={{ color: team.colorHex }}>
                              {formatPoints(
                                view === 'overall'
                                  ? team.gamePoints + team.athleticsPoints
                                  : team.total,
                              )}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <ul className="mt-5 space-y-2.5 md:hidden">
                  {ledger.map(({ event, points, places }) => (
                    <li key={event.id} className="panel p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] text-ink-primary">{eventLabel(event)}</span>
                        <CategoryTag category={event.category} />
                      </div>
                      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                        {rows
                          .filter((team) => points[team.id])
                          .map((team) => (
                            <li key={team.id} className="flex items-center gap-1.5">
                              <TeamDot color={team.colorHex} size={6} />
                              <span className="text-[12px] text-ink-secondary">{team.short}</span>
                              <span
                                className="score text-[13px]"
                                style={{ color: MEDALS[places[team.id]]?.text }}
                              >
                                +{formatPoints(points[team.id])}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {view === 'overall' && (
              <p className="mt-5 text-[12px] leading-relaxed text-ink-muted">
                The ledger shows points as they were won. Games points count into the total
                directly; athletics does not — it arrives only as the{' '}
                <span className="score text-ink-secondary">
                  {ATHLETICS_CHAMPION_POINTS.join(' / ')}
                </span>{' '}
                earned for topping the men’s and women’s athletics tables,{' '}
                {trackDone ? 'now counted.' : 'once every athletics event is decided.'}
              </p>
            )}
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
  settled,
  bonus,
  bonusAwarded,
}: {
  team: TeamStanding;
  place: 0 | 1 | 2;
  gap: number;
  settled: boolean;
  /** Shown on the two tables that hand out the athletics bonus. */
  bonus?: number;
  bonusAwarded?: boolean;
}) {
  const medal = MEDALS[place];
  const first = place === 0;

  return (
    <article
      className="panel relative overflow-hidden p-5"
      style={{ borderColor: first ? 'rgb(247 206 91 / 0.34)' : undefined }}
    >
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
            {settled ? 'Champions' : 'Leading'}
          </span>
        ) : (
          <span className="score text-[11px] text-ink-muted">−{formatPoints(gap)} pts</span>
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
        <div className="shrink-0 text-right">
          <p
            className={`score leading-none ${first ? 'text-4xl' : 'text-3xl'}`}
            style={{ color: medal.text }}
          >
            {formatPoints(team.total)}
          </p>
          {bonus !== undefined && team.total > 0 && (
            <p
              className="score mt-1.5 text-[11px]"
              style={{ color: bonusAwarded ? medal.text : 'var(--color-ink-muted)' }}
            >
              +{bonus} overall
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
