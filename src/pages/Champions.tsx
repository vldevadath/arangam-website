// src/pages/Champions.tsx
// The individual championship. Only athletics carries individual points, so
// only athletes named on an athletics podium appear here.

import { useEffect, useRef } from 'react';
import { Medal } from 'lucide-react';
import confetti from 'canvas-confetti';
import PageHeader from '../components/layout/PageHeader';
import { EmptyState, MEDALS, TeamDot } from '../components/ui';
import { teamColor, teamName, type AthleteStanding } from '../data/standings';
import { useAthletes, useMeet } from '../hooks/useMeet';
import type { Team } from '../data/types';

export default function Champions() {
  const { snapshot } = useMeet();
  const men = useAthletes('men');
  const women = useAthletes('women');
  const overall = useAthletes();

  const bestMan = men[0];
  const bestWoman = women[0];
  const celebrated = useRef(false);

  // A single burst the first time both individual champions are settled.
  useEffect(() => {
    if (celebrated.current || !bestMan || !bestWoman) return;
    celebrated.current = true;
    confetti({
      particleCount: 90,
      spread: 78,
      startVelocity: 34,
      origin: { y: 0.35 },
      colors: ['#F7CE5B', '#D9A82E', '#7FC6FF', '#2FB673'],
      disableForReducedMotion: true,
    });
  }, [bestMan, bestWoman]);

  return (
    <>
      <PageHeader
        eyebrow="Athletics"
        title="Individual Champions"
        subtitle="Individual points are awarded 4 / 3 / 2 for the first three places in every athletics event, including relays."
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {overall.length === 0 ? (
          <EmptyState
            title="No athletes on the board"
            hint="Athlete names recorded against athletics podiums build this table automatically."
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <ChampionCard title="Best Athlete · Men" athlete={bestMan} teams={snapshot.teams} />
              <ChampionCard title="Best Athlete · Women" athlete={bestWoman} teams={snapshot.teams} />
            </div>

            <h2 className="mt-14 font-display text-2xl tracking-[0.06em] text-ink-primary uppercase">
              Individual points table
            </h2>

            <div className="panel mt-5 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-pitch-line">
                    {['#', 'Athlete', 'Batch', 'Events', 'Medals', 'Points'].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 font-display text-[10px] font-500 tracking-[0.22em] text-ink-muted uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overall.map((athlete) => (
                    <tr
                      key={`${athlete.teamId}-${athlete.name}`}
                      className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                    >
                      <td className="score px-4 py-3 text-[13px] text-ink-muted">{athlete.rank}</td>
                      <td className="px-4 py-3 text-[14px] whitespace-nowrap text-ink-primary">
                        {athlete.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-[13px] whitespace-nowrap text-ink-secondary">
                          <TeamDot color={teamColor(snapshot.teams, athlete.teamId)} size={6} />
                          {teamName(snapshot.teams, athlete.teamId)}
                        </span>
                      </td>
                      <td className="score px-4 py-3 text-[13px] text-ink-secondary">{athlete.events}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-3">
                          {[athlete.golds, athlete.silvers, athlete.bronzes].map((count, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: MEDALS[i].text, opacity: count ? 1 : 0.2 }}
                              />
                              <span className="score text-[12px] text-ink-secondary">{count}</span>
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="score px-4 py-3 text-[15px] text-crest-bright">{athlete.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function ChampionCard({
  title,
  athlete,
  teams,
}: {
  title: string;
  athlete: AthleteStanding | undefined;
  teams: Team[];
}) {
  return (
    <article className="panel relative overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-crest/10 blur-3xl"
      />
      <p className="eyebrow relative">{title}</p>

      {athlete ? (
        <div className="relative mt-4 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-crest/40 bg-crest/10 text-crest-bright">
            <Medal size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-2xl tracking-[0.04em] text-ink-primary">
              {athlete.name}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-muted">
              <TeamDot color={teamColor(teams, athlete.teamId)} size={6} />
              {teamName(teams, athlete.teamId)} · {athlete.events} events
            </p>
          </div>
          <div className="text-right">
            <p className="score text-3xl text-crest-bright">{athlete.points}</p>
            <p className="font-display text-[10px] tracking-[0.22em] text-ink-muted uppercase">pts</p>
          </div>
        </div>
      ) : (
        <p className="relative mt-4 text-[13px] text-ink-muted">Yet to be decided.</p>
      )}
    </article>
  );
}
