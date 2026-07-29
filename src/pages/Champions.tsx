// src/pages/Champions.tsx
// The individual championship. Anyone named on the podium of an event that
// carries individual points appears here, and one person's points add up
// across every event they place in.

import { useEffect, useRef } from 'react';
import { Medal } from 'lucide-react';
import confetti from 'canvas-confetti';
import PageHeader from '../components/layout/PageHeader';
import { EmptyState, MEDALS, TeamDot } from '../components/ui';
import { teamColor, teamName, type PersonStanding } from '../data/standings';
import { usePeople, useMeet } from '../hooks/useMeet';
import type { Team } from '../data/types';

export default function Champions() {
  const { snapshot } = useMeet();
  const men = usePeople('men');
  const women = usePeople('women');
  const overall = usePeople();

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
        eyebrow="Individual championship"
        title="Champions"
        subtitle="Points follow the person, not the batch. Compete in as many events as you like — every placing in an event that carries individual points adds to your total."
      />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {overall.length === 0 ? (
          <EmptyState
            title="Nobody on the board yet"
            hint="Names recorded against a podium build this table automatically."
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <ChampionCard title="Best · Men" person={bestMan} teams={snapshot.teams} />
              <ChampionCard title="Best · Women" person={bestWoman} teams={snapshot.teams} />
            </div>

            <h2 className="mt-12 font-display text-2xl tracking-[0.06em] text-ink-primary uppercase sm:mt-14">
              Individual points
            </h2>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              {overall.length} {overall.length === 1 ? 'person has' : 'people have'} scored.
            </p>

            {/* Phone: one card per person */}
            <ul className="mt-5 space-y-2.5 md:hidden">
              {overall.map((person) => (
                <li
                  key={`${person.teamId}-${person.name}`}
                  className="panel flex items-center gap-3 p-4"
                >
                  <span className="score w-6 shrink-0 text-center text-[13px] text-ink-muted">
                    {person.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-ink-primary">{person.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <TeamDot color={teamColor(snapshot.teams, person.teamId)} size={6} />
                        {teamName(snapshot.teams, person.teamId)}
                      </span>
                      <span>·</span>
                      <span>{person.events} events</span>
                      <span>·</span>
                      <Medals person={person} />
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="score text-xl text-crest-bright">{person.points}</p>
                    <p className="font-display text-[9px] tracking-[0.2em] text-ink-muted uppercase">
                      pts
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="panel mt-5 hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-pitch-line">
                    {['#', 'Name', 'Batch', 'Events', 'Medals', 'Points'].map((heading) => (
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
                  {overall.map((person) => (
                    <tr
                      key={`${person.teamId}-${person.name}`}
                      className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
                    >
                      <td className="score px-4 py-3 text-[13px] text-ink-muted">{person.rank}</td>
                      <td className="px-4 py-3 text-[14px] whitespace-nowrap text-ink-primary">
                        {person.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-[13px] whitespace-nowrap text-ink-secondary">
                          <TeamDot color={teamColor(snapshot.teams, person.teamId)} size={6} />
                          {teamName(snapshot.teams, person.teamId)}
                        </span>
                      </td>
                      <td className="score px-4 py-3 text-[13px] text-ink-secondary">
                        {person.events}
                      </td>
                      <td className="px-4 py-3">
                        <Medals person={person} />
                      </td>
                      <td className="score px-4 py-3 text-[15px] text-crest-bright">
                        {person.points}
                      </td>
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

function Medals({ person }: { person: PersonStanding }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {[person.golds, person.silvers, person.bronzes].map((count, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: MEDALS[i].text, opacity: count ? 1 : 0.2 }}
          />
          <span className="score text-[12px] text-ink-secondary">{count}</span>
        </span>
      ))}
    </span>
  );
}

function ChampionCard({
  title,
  person,
  teams,
}: {
  title: string;
  person: PersonStanding | undefined;
  teams: Team[];
}) {
  return (
    <article className="panel relative overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-crest/10 blur-3xl"
      />
      <p className="eyebrow relative">{title}</p>

      {person ? (
        <div className="relative mt-4 flex items-center gap-3 sm:gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-crest/40 bg-crest/10 text-crest-bright sm:h-12 sm:w-12">
            <Medal size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl tracking-[0.04em] text-ink-primary sm:text-2xl">
              {person.name}
            </p>
            <p className="mt-0.5 flex items-center gap-2 truncate text-[12px] text-ink-muted">
              <TeamDot color={teamColor(teams, person.teamId)} size={6} />
              {teamName(teams, person.teamId)} · {person.events} events
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="score text-3xl text-crest-bright">{person.points}</p>
            <p className="font-display text-[10px] tracking-[0.22em] text-ink-muted uppercase">pts</p>
          </div>
        </div>
      ) : (
        <p className="relative mt-4 text-[13px] text-ink-muted">Yet to be decided.</p>
      )}
    </article>
  );
}
