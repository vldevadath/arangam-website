// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { MEET } from '../../data/catalog';

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-pitch-line bg-pitch-surface/60">
      <div aria-hidden className="lanes h-8 w-full opacity-25" />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="malayalam text-2xl leading-none text-crest-bright">{MEET.nameMl}</p>
          <p className="mt-2 font-display text-[11px] tracking-[0.3em] text-ink-secondary uppercase">
            {MEET.name} · {MEET.tagline}
          </p>
          <p className="mt-1 font-score text-[11px] text-ink-muted">{MEET.edition}</p>
        </div>

        <div>
          <p className="eyebrow">Organised by</p>
          <p className="mt-2 text-sm text-ink-secondary">{MEET.union}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            {MEET.university}
            <br />
            {MEET.college}
          </p>
        </div>

        <div>
          <p className="eyebrow">Pages</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {[
              ['/events', 'Events & Points'],
              ['/standings', 'Standings'],
              ['/results', 'Results'],
              ['/champions', 'Individual Champions'],
              ['/desk', 'Results Desk'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-ink-muted no-underline transition-colors hover:text-crest-bright"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rule" />
      <p className="py-4 text-center text-[11px] text-ink-muted">
        © {MEET.edition} {MEET.union}. Points as per the official {MEET.name} scoring sheet.
      </p>
    </footer>
  );
}
