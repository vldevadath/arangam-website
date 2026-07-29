// src/components/layout/TopBar.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { MEET } from '../../data/catalog';
import SideNav from './SideNav';

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const openNav = useCallback(() => setOpen(true), []);
  const closeNav = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${
          scrolled ? 'glass border-b border-pitch-line' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={openNav}
            aria-label="Open navigation"
            className="-ml-2 grid h-10 w-10 place-items-center rounded-md text-ink-secondary transition-colors hover:bg-white/5 hover:text-crest-bright"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="group flex min-w-0 items-baseline gap-2.5 no-underline">
            <span className="font-display text-lg leading-none font-600 tracking-[0.2em] text-ink-primary transition-colors group-hover:text-crest-bright">
              {MEET.name}
            </span>
            <span className="hidden truncate font-display text-[10px] tracking-[0.3em] text-ink-muted uppercase sm:inline">
              {MEET.tagline}
            </span>
          </Link>

          <span className="ml-auto shrink-0 font-score text-[10px] tracking-[0.2em] text-crest-dim">
            {MEET.edition}
          </span>
        </div>

        {/* Lane stripes double as the header's bottom rule */}
        <div className="lanes h-px w-full opacity-70" aria-hidden />
      </header>

      <SideNav open={open} onClose={closeNav} />
    </>
  );
}
