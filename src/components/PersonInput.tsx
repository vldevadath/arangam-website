// src/components/PersonInput.tsx
// A name field that suggests people already recorded.
//
// Replaces <datalist>, whose dropdown is drawn by the operating system and
// cannot be styled — it arrives as a grey system menu in the middle of a dark
// page. This renders the list itself, in a portal so no ancestor's
// `overflow-hidden` can clip it, and supports the keyboard the same way the
// native control does.

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  people: string[];
  disabled?: boolean;
  placeholder?: string;
  label: string;
  className?: string;
};

const MAX_SUGGESTIONS = 6;

export default function PersonInput({
  value,
  onChange,
  people,
  disabled,
  placeholder = 'Name',
  label,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();

  const matches = useMemo(() => {
    const pool = people.filter((p) => p.toLowerCase() !== query);
    if (!query) return pool.slice(0, MAX_SUGGESTIONS);
    // Names starting with what was typed come first — that is what someone
    // half-way through typing is almost always reaching for.
    const starts = pool.filter((p) => p.toLowerCase().startsWith(query));
    const contains = pool.filter(
      (p) => !p.toLowerCase().startsWith(query) && p.toLowerCase().includes(query),
    );
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
  }, [people, query]);

  const showing = open && !disabled && matches.length > 0;

  // Track the input so the floating list stays glued to it while scrolling.
  useEffect(() => {
    if (!showing) return;
    const track = () => setRect(inputRef.current?.getBoundingClientRect() ?? null);
    track();
    window.addEventListener('scroll', track, true);
    window.addEventListener('resize', track);
    return () => {
      window.removeEventListener('scroll', track, true);
      window.removeEventListener('resize', track);
    };
  }, [showing]);

  // A click anywhere else dismisses it.
  useEffect(() => {
    if (!showing) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inputRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showing]);

  useEffect(() => setActive(0), [query]);

  function choose(name: string) {
    onChange(name);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showing) {
      if (e.key === 'ArrowDown') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      // Only swallow Enter when a suggestion is genuinely highlighted.
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={label}
        role="combobox"
        aria-expanded={showing}
        aria-autocomplete="list"
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        className={`field disabled:opacity-40 ${className}`}
      />

      {showing &&
        rect &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            aria-label="Names already recorded"
            className="fixed z-[200] overflow-hidden rounded-md border border-pitch-line bg-pitch-surface/95 shadow-lift backdrop-blur-xl"
            style={{
              top: rect.bottom + 6,
              left: rect.left,
              width: Math.max(rect.width, 180),
            }}
          >
            <p className="flex items-center gap-1.5 border-b border-pitch-line px-3 py-1.5 font-display text-[9px] tracking-[0.2em] text-ink-muted uppercase">
              <Users size={11} />
              Already recorded
            </p>
            <ul className="max-h-56 overflow-y-auto py-1">
              {matches.map((name, i) => (
                <li key={name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    // mousedown fires before the input's blur, so the click lands.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(name);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`block w-full px-3 py-2 text-left text-[13px] transition-colors ${
                      i === active
                        ? 'bg-crest/12 text-crest-bright'
                        : 'text-ink-secondary hover:bg-white/[0.04]'
                    }`}
                  >
                    <Highlight name={name} query={query} />
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Picks out the typed part so the match is obvious at a glance. */
function Highlight({ name, query }: { name: string; query: string }) {
  if (!query) return <>{name}</>;
  const at = name.toLowerCase().indexOf(query);
  if (at < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, at)}
      <span className="font-600 text-crest-bright">{name.slice(at, at + query.length)}</span>
      {name.slice(at + query.length)}
    </>
  );
}
