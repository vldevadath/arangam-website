// src/components/ui.tsx
// Small shared pieces. Anything used on more than one page lives here so the
// medal colours and the batch swatches stay identical across the site.

import type { ReactNode } from 'react';
import { CircleDashed } from 'lucide-react';
import type { Category, Discipline } from '../data/types';

export const MEDALS = [
  { label: '1st', ring: '#F7CE5B', fill: 'rgb(247 206 91 / 0.14)', text: '#F7CE5B' },
  { label: '2nd', ring: '#C6D0DE', fill: 'rgb(198 208 222 / 0.12)', text: '#C6D0DE' },
  { label: '3rd', ring: '#C4783C', fill: 'rgb(196 120 60 / 0.14)', text: '#D69256' },
] as const;

export function MedalBadge({ place, size = 'md' }: { place: 0 | 1 | 2; size?: 'sm' | 'md' }) {
  const medal = MEDALS[place];
  const dim = size === 'sm' ? 'h-6 w-6 text-[9px]' : 'h-8 w-8 text-[11px]';
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border font-display font-600 tracking-wide ${dim}`}
      style={{ borderColor: medal.ring, background: medal.fill, color: medal.text }}
    >
      {medal.label}
    </span>
  );
}

export function TeamDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: color, boxShadow: `0 0 8px ${color}66` }}
      aria-hidden
    />
  );
}

export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'crest' | 'flood' | 'turf';
}) {
  const tones = {
    neutral: 'border-pitch-line text-ink-muted',
    crest: 'border-crest/35 bg-crest/10 text-crest-bright',
    flood: 'border-flood/30 bg-flood/10 text-flood',
    turf: 'border-turf/30 bg-turf/10 text-turf',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-display text-[10px] tracking-[0.18em] uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function CategoryTag({ category }: { category: Category }) {
  const tone = category === 'men' ? 'flood' : category === 'women' ? 'crest' : 'turf';
  const label = category === 'men' ? 'Men' : category === 'women' ? 'Women' : 'Mixed';
  return <Tag tone={tone}>{label}</Tag>;
}

export function DisciplineTag({ discipline }: { discipline: Discipline }) {
  return <Tag>{discipline === 'game' ? 'Game' : 'Athletics'}</Tag>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
      <CircleDashed size={28} className="text-pitch-line" />
      <p className="font-display text-sm tracking-[0.22em] text-ink-secondary uppercase">{title}</p>
      {hint && <p className="max-w-sm text-[13px] text-ink-muted">{hint}</p>}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-md border border-pitch-line bg-pitch-base/60 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`rounded px-3.5 py-1.5 font-display text-[11px] tracking-[0.18em] uppercase transition-colors ${
              active ? 'bg-crest/15 text-crest-bright' : 'text-ink-muted hover:text-ink-secondary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Points as they appear on the official sheet: 10 / 5 / 2 */
export function PointsTriple({ points }: { points: readonly number[] }) {
  return (
    <span className="score text-[13px] whitespace-nowrap text-ink-secondary">
      {points.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="px-1 text-pitch-line">/</span>}
          <span style={{ color: MEDALS[i]?.text }}>{p}</span>
        </span>
      ))}
    </span>
  );
}
