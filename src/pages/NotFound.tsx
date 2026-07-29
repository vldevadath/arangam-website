// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import { MEET } from '../data/catalog';

export default function NotFound() {
  return (
    <div className="relative grid min-h-[80vh] place-items-center overflow-hidden px-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-flood-deep/35 blur-[100px]"
      />
      <div className="relative">
        <p className="score text-6xl text-crest-dim">404</p>
        <h1 className="mt-4 font-display text-2xl tracking-[0.12em] text-ink-primary uppercase">
          False start
        </h1>
        <p className="mt-3 text-[13px] text-ink-muted">
          That page is not on the {MEET.name} programme.
        </p>
        <Link to="/" className="btn btn-crest mt-6 no-underline">
          Back to the ground
        </Link>
      </div>
    </div>
  );
}
