// src/components/layout/OpeningCeremony.tsx
// First-visit intro: a floodlight bar sweeps across the crest, the way the
// lights come up over a night meet. Shown once per browser session.

import { useEffect, useState } from 'react';
import Crest from '../Crest';
import { MEET } from '../../data/catalog';

const HOLD_MS = 2200;
const FADE_MS = 700;

export default function OpeningCeremony({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), HOLD_MS);
    const done = setTimeout(onDone, HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-pitch-base transition-opacity duration-700"
      style={{ opacity: leaving ? 0 : 1, pointerEvents: leaving ? 'none' : 'auto' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-[70vh] w-[80vw] -translate-x-1/2 rounded-full bg-flood-deep/35 blur-[100px]"
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative overflow-hidden">
          <Crest size={420} style={{ width: 'min(280px, 62vw)', height: 'auto' }} />
          {/* The light bar */}
          <div
            aria-hidden
            className="animate-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
        </div>

        <p className="mt-8 font-display text-sm tracking-[0.42em] text-crest uppercase">
          {MEET.tagline}
        </p>
        <div className="rule mt-4 w-40" />
        <p className="mt-4 max-w-sm text-[13px] text-ink-muted italic">
          “Five batches. One track. Let the stands decide.”
        </p>
      </div>
    </div>
  );
}
