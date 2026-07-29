// src/components/layout/SideNav.tsx
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, Home, Medal, ListOrdered, ShieldCheck, Trophy, X } from 'lucide-react';
import { MEET } from '../../data/catalog';

type Props = { open: boolean; onClose: () => void };

const LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/events', label: 'Events & Points', icon: ClipboardList },
  { to: '/standings', label: 'Standings', icon: ListOrdered },
  { to: '/results', label: 'Results', icon: Trophy },
  { to: '/champions', label: 'Individual Champions', icon: Medal },
];

export default function SideNav({ open, onClose }: Props) {
  const { pathname } = useLocation();

  // Any navigation closes the drawer.
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-pitch-line bg-pitch-surface/95 backdrop-blur-xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between border-b border-pitch-line px-5 py-5">
          <div>
            <p className="malayalam text-xl leading-none text-crest-bright">{MEET.nameMl}</p>
            <p className="mt-1.5 font-display text-[10px] tracking-[0.3em] text-ink-muted uppercase">
              {MEET.name} {MEET.edition}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-1 grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-primary"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="no-underline">
              {({ isActive }) => (
                <div
                  className={`flex items-center gap-3.5 rounded-md border px-4 py-3 transition-colors ${
                    isActive
                      ? 'border-crest/30 bg-crest/10 text-crest-bright'
                      : 'border-transparent text-ink-secondary hover:bg-white/[0.04] hover:text-ink-primary'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="font-display text-xs tracking-[0.2em] uppercase">{label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-crest-bright" />}
                </div>
              )}
            </NavLink>
          ))}

          <div className="rule my-3" />

          <NavLink to="/desk" className="no-underline">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3.5 rounded-md border px-4 py-3 transition-colors ${
                  isActive
                    ? 'border-flood/30 bg-flood/10 text-flood'
                    : 'border-transparent text-ink-muted hover:bg-white/[0.04] hover:text-ink-secondary'
                }`}
              >
                <ShieldCheck size={16} className="shrink-0" />
                <span className="font-display text-xs tracking-[0.2em] uppercase">Results Desk</span>
              </div>
            )}
          </NavLink>
        </nav>

        <div className="border-t border-pitch-line px-5 py-4">
          <p className="font-display text-[10px] tracking-[0.25em] text-crest-dim uppercase">
            {MEET.union}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            {MEET.university}
            <br />
            {MEET.college}
          </p>
        </div>
      </aside>
    </>
  );
}
