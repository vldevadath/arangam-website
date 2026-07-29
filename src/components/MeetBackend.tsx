// src/components/MeetBackend.tsx
// Mounts the Convex client only when a deployment URL is configured. Without
// one the app runs entirely on the browser-local store and no socket opens.

import type { ReactNode } from 'react';
import { ConvexProvider } from 'convex/react';
import { convexClient } from '../data/convexClient';

export function MeetBackend({ children }: { children: ReactNode }) {
  if (!convexClient) return <>{children}</>;
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
