// src/components/MeetBackend.tsx
// Mounts the Convex client only when a deployment URL is configured. Without
// one the app runs entirely on the browser-local store and no socket opens.

import { useState, type ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { USING_CONVEX } from '../hooks/useMeet';

export function MeetBackend({ children }: { children: ReactNode }) {
  const [client] = useState(() =>
    USING_CONVEX ? new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string) : null,
  );

  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
