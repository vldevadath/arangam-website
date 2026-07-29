// src/pages/DeskLogin.tsx
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { isSignedIn, signIn } from '../data/auth';
import { MEET } from '../data/catalog';

export default function DeskLogin() {
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isSignedIn()) navigate('/desk/board', { replace: true });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    setError('');
    try {
      // Checked by the deployment, not in the browser.
      if (await signIn(passcode)) {
        navigate('/desk/board', { replace: true });
        return;
      }
      setError('That passcode was not recognised.');
      setPasscode('');
    } catch {
      setError('Could not reach the results server. Check your connection and try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 pt-14">
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-flood-deep/40 blur-[110px]"
      />

      <form onSubmit={handleSubmit} className="panel relative w-full max-w-sm p-7">
        <div className="grid h-11 w-11 place-items-center rounded-full border border-flood/30 bg-flood/10 text-flood">
          <ShieldCheck size={20} />
        </div>

        <h1 className="mt-5 font-display text-2xl tracking-[0.06em] text-ink-primary uppercase">
          Results Desk
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          For {MEET.union} volunteers recording results at the ground.
        </p>

        <label
          htmlFor="passcode"
          className="mt-6 block font-display text-[10px] tracking-[0.24em] text-ink-muted uppercase"
        >
          Passcode
        </label>
        <div className="relative mt-2">
          <KeyRound
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
          />
          <input
            id="passcode"
            type="password"
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setError('');
            }}
            placeholder="••••••••"
            className="field pl-9"
          />
        </div>

        {error && <p className="mt-3 text-[12px] text-clay">{error}</p>}

        <button
          type="submit"
          disabled={checking || !passcode}
          className="btn btn-crest mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Sign in'}
        </button>

        <p className="mt-5 border-t border-pitch-line pt-4 text-[11px] leading-relaxed text-ink-muted">
          The passcode is checked by the results server and never stored in this page, so only the
          desk can change the meet. Everyone else sees the results read-only.
        </p>
      </form>
    </div>
  );
}
