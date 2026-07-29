// src/pages/Home.tsx
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Medal, Trophy } from 'lucide-react';
import Crest from '../components/Crest';
import { MEDALS, TeamDot } from '../components/ui';
import { ATHLETICS, GAMES, MEET, eventLabel } from '../data/catalog';
import { decidedEvents } from '../data/standings';
import { useMeet } from '../hooks/useMeet';

export default function Home() {
  const { snapshot, teams, progress } = useMeet();
  const leader = teams[0];
  const chasers = teams.slice(1);
  const maxTotal = Math.max(1, leader?.total ?? 1);
  const latest = decidedEvents(snapshot).slice(-4).reverse();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-16 text-center">
        {/* Two floodlights raking in from the upper corners */}
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -top-32 -left-20 h-[34rem] w-[34rem] rounded-full bg-flood-deep/45 blur-[110px]"
        />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -top-24 -right-24 h-[30rem] w-[30rem] rounded-full bg-flood-deep/35 blur-[110px]"
          style={{ animationDelay: '-4s' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-crest-dim/12 to-transparent"
        />
        <div aria-hidden className="lanes pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-40" />

        <p className="animate-rise relative font-display text-[11px] tracking-[0.4em] text-crest uppercase">
          {MEET.union}
        </p>

        <div className="animate-rise relative mt-6" style={{ animationDelay: '80ms' }}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -m-10 rounded-full bg-crest/12 blur-3xl"
          />
          {/* The crest already carries the wordmark, the tagline and the year. */}
          <Crest size={760} style={{ width: 'auto', height: 'min(46vh, 340px)' }} />
        </div>

        <h1 className="sr-only">
          {MEET.name} {MEET.edition} — {MEET.tagline}, {MEET.college}
        </h1>

        <div className="rule animate-rise relative mt-8 w-32" style={{ animationDelay: '160ms' }} />
        <p
          className="animate-rise relative mt-5 font-display text-sm tracking-[0.32em] text-ink-secondary uppercase"
          style={{ animationDelay: '200ms' }}
        >
          Five batches · One championship
        </p>
        <p
          className="animate-rise relative mt-3 text-[13px] text-ink-muted"
          style={{ animationDelay: '240ms' }}
        >
          {MEET.university} · {MEET.college}
        </p>

        <div
          className="animate-rise relative mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: '300ms' }}
        >
          <Link to="/standings" className="btn btn-crest no-underline">
            Live standings <ArrowRight size={15} />
          </Link>
          <Link to="/events" className="btn btn-ghost no-underline">
            Events & points
          </Link>
        </div>

        {/* Meet at a glance */}
        <dl
          className="animate-rise relative mt-12 grid w-full max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-lg border border-pitch-line bg-pitch-line"
          style={{ animationDelay: '360ms' }}
        >
          {[
            { label: 'Games', value: GAMES.length },
            { label: 'Athletics', value: ATHLETICS.length },
            { label: 'Decided', value: `${progress.decided}/${progress.total}` },
          ].map((stat) => (
            <div key={stat.label} className="bg-pitch-surface px-3 py-5">
              <dd className="score text-2xl text-crest-bright sm:text-3xl">{stat.value}</dd>
              <dt className="mt-1 font-display text-[10px] tracking-[0.24em] text-ink-muted uppercase">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Leaderboard ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Overall championship</p>
            <h2 className="mt-2 font-display text-3xl tracking-[0.06em] text-ink-primary uppercase">
              The Board
            </h2>
          </div>
          <Link
            to="/standings"
            className="font-display text-[11px] tracking-[0.2em] text-ink-muted no-underline uppercase transition-colors hover:text-crest-bright"
          >
            Full breakdown →
          </Link>
        </div>

        {progress.decided === 0 ? (
          <div className="panel mt-6 flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Trophy size={30} className="text-pitch-line" />
            <p className="font-display text-sm tracking-[0.22em] text-ink-secondary uppercase">
              No events decided yet
            </p>
            <p className="max-w-sm text-[13px] text-ink-muted">
              The board fills as results come in from the ground. Until then, the programme and its
              points are on the events page.
            </p>
          </div>
        ) : (
          <>
            {leader && (
              <article
                className="panel relative mt-6 overflow-hidden p-6 sm:p-8"
                style={{ borderColor: 'rgb(247 206 91 / 0.32)' }}
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #F7CE5B, transparent)',
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-crest/12 blur-3xl"
                />
                <div className="relative flex flex-wrap items-center gap-5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-crest-bright to-crest text-pitch-base shadow-crest">
                    <Trophy size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[10px] tracking-[0.3em] text-crest uppercase">
                        Leading
                      </span>
                      <TeamDot color={leader.colorHex} />
                    </div>
                    <p className="mt-1 truncate font-display text-3xl tracking-[0.04em] text-ink-primary uppercase">
                      {leader.name}
                    </p>
                    <p className="score mt-1 text-[11px] text-ink-muted">
                      {leader.golds}G · {leader.silvers}S · {leader.bronzes}B
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="score text-5xl text-crest-bright text-crest-glow">{leader.total}</p>
                    <p className="font-display text-[10px] tracking-[0.24em] text-ink-muted uppercase">
                      Points
                    </p>
                  </div>
                </div>
              </article>
            )}

            <ol className="mt-3 space-y-2">
              {chasers.map((team) => (
                <li
                  key={team.id}
                  className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-pitch-line bg-pitch-surface/70 px-4 py-3.5"
                >
                  {/* Points bar, relative to the leader */}
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 opacity-[0.11] transition-[width] duration-700"
                    style={{
                      width: `${(team.total / maxTotal) * 100}%`,
                      background: `linear-gradient(90deg, ${team.colorHex}, transparent)`,
                    }}
                  />
                  <span className="score relative w-6 shrink-0 text-center text-sm text-ink-muted">
                    {team.rank}
                  </span>
                  <TeamDot color={team.colorHex} />
                  <span className="relative min-w-0 flex-1 truncate font-display text-lg tracking-[0.04em] text-ink-primary">
                    {team.name}
                  </span>
                  <span className="score relative text-xl text-ink-primary">{team.total}</span>
                  <span className="relative font-display text-[10px] text-ink-muted uppercase">pts</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      {/* ── Latest results ───────────────────────────────────────────────── */}
      {latest.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
          <p className="eyebrow">Just in</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {latest.map(({ event, result }) => (
              <article key={event.id} className="panel p-4">
                <p className="font-display text-sm tracking-[0.08em] text-ink-primary uppercase">
                  {eventLabel(event)}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {(['first', 'second', 'third'] as const).map((slot, i) => {
                    const placing = result[slot];
                    if (!placing) return null;
                    const team = snapshot.teams.find((t) => t.id === placing.teamId);
                    return (
                      <li key={slot} className="flex items-center gap-2.5 text-[13px]">
                        <span className="score w-7 text-[10px]" style={{ color: MEDALS[i].text }}>
                          {MEDALS[i].label}
                        </span>
                        <TeamDot color={team?.colorHex ?? '#626d7e'} size={6} />
                        <span className="truncate text-ink-secondary">{team?.name ?? '—'}</span>
                        {placing.athlete && (
                          <span className="truncate text-ink-muted">· {placing.athlete}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Navigation cards ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              to: '/events',
              icon: ClipboardList,
              title: 'Events & Points',
              copy: `All ${GAMES.length + ATHLETICS.length} events with the points each placing carries.`,
            },
            {
              to: '/results',
              icon: Trophy,
              title: 'Results',
              copy: 'Podiums event by event, as they are declared.',
            },
            {
              to: '/champions',
              icon: Medal,
              title: 'Individual Champions',
              copy: 'Athletics points per athlete, and the best of the meet.',
            },
          ].map(({ to, icon: Icon, title, copy }) => (
            <Link
              key={to}
              to={to}
              className="panel group flex flex-col gap-2 p-5 no-underline transition-colors hover:border-crest-dim"
            >
              <Icon size={18} className="text-crest transition-transform group-hover:scale-110" />
              <p className="font-display text-base tracking-[0.08em] text-ink-primary uppercase">
                {title}
              </p>
              <p className="text-[13px] leading-relaxed text-ink-muted">{copy}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
