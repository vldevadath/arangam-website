// src/data/convexClient.ts
// One client for the whole app, created at module load so both the React
// provider and the imperative sign-in check share the same connection.

import { ConvexReactClient } from 'convex/react';

const url = import.meta.env.VITE_CONVEX_URL;

export const USING_CONVEX = Boolean(url);

/** Null when no deployment is configured — the app then runs on localStorage. */
export const convexClient = url ? new ConvexReactClient(url) : null;
