// src/components/layout/PageHeader.tsx
import type { ReactNode } from 'react';
import { MEET } from '../../data/catalog';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export default function PageHeader({ eyebrow, title, subtitle, children }: Props) {
  return (
    <header className="relative overflow-hidden border-b border-pitch-line pt-24 pb-10">
      {/* Floodlight wash from the top-left corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-24 h-80 w-[36rem] rounded-full bg-flood-deep/40 blur-3xl"
      />
      <div aria-hidden className="lanes pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-30" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="eyebrow">{eyebrow ?? `${MEET.name} ${MEET.edition}`}</p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.06em] text-ink-primary uppercase sm:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm text-ink-secondary">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}
