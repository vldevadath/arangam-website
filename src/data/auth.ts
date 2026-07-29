// src/data/auth.ts
// Gate for the results desk. This keeps the dashboard out of the way of
// casual visitors; it is not a security boundary, because a static site has
// no server to check a password against. Anyone who can open the console can
// edit the store directly. Put the site behind Netlify password protection —
// or move to the Convex backend with real auth — before it matters.

const SESSION_KEY = 'arangam:desk-session';
const SESSION_HOURS = 8;

const PASSCODE = import.meta.env.VITE_DESK_PASSCODE || 'arangam@desk2526';

type Session = { expires: number };

export function signIn(passcode: string): boolean {
  if (passcode !== PASSCODE) return false;
  const session: Session = { expires: Date.now() + SESSION_HOURS * 3600_000 };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return true;
}

export function signOut(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isSignedIn(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { expires } = JSON.parse(raw) as Session;
    return Date.now() < expires;
  } catch {
    return false;
  }
}
