// src/data/auth.ts
// Sign-in for the results desk.
//
// With a Convex deployment the passcode is never in the bundle: the sign-in
// screen asks the server whether it is right, and every write carries it for
// the server to check again. Reading the site's JavaScript reveals nothing,
// and the browser cannot write to the meet without knowing the secret.
//
// Without a deployment the app is a single-browser scratchpad on
// localStorage, so the check is local and the fallback below is a placeholder
// rather than a real secret.

import { anyApi } from 'convex/server';
import { convexClient, USING_CONVEX } from './convexClient';

const SESSION_KEY = 'ankam:desk-session';
const SESSION_HOURS = 8;

/** Only used when there is no Convex deployment. Not a secret. */
const LOCAL_PASSCODE = import.meta.env.VITE_DESK_PASSCODE || 'ankam-local';

type Session = { passcode: string; expires: number };

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return Date.now() < session.expires ? session : null;
  } catch {
    return null;
  }
}

export async function signIn(passcode: string): Promise<boolean> {
  if (USING_CONVEX && convexClient) {
    const ok = await convexClient.query(anyApi.meet.checkPasscode, { passcode });
    if (!ok) return false;
  } else if (passcode !== LOCAL_PASSCODE) {
    return false;
  }

  // Held for the session so each write can present it to the server.
  const session: Session = { passcode, expires: Date.now() + SESSION_HOURS * 3600_000 };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return true;
}

export function signOut(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isSignedIn(): boolean {
  return readSession() !== null;
}

/** The passcode to send with a write. Empty if signed out — the server refuses. */
export function deskPasscode(): string {
  return readSession()?.passcode ?? '';
}
