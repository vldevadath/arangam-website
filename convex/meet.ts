import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const DEFAULT_TEAMS = [
  { teamId: 'pg-phd', name: 'PG & PhD', short: 'PG', colorHex: '#A855F7' },
  { teamId: 'batch-22', name: "'22 Batch", short: "'22", colorHex: '#7FC6FF' },
  { teamId: 'batch-23', name: "'23 Batch", short: "'23", colorHex: '#2FB673' },
  { teamId: 'batch-24', name: "'24 Batch", short: "'24", colorHex: '#F7CE5B' },
  { teamId: 'batch-25', name: "'25 Batch", short: "'25", colorHex: '#C4562C' },
];

/**
 * Every write presents the desk passcode, which is checked here rather than in
 * the browser. The secret lives in the deployment's environment
 * (`npx convex env set DESK_PASSCODE …`) and never reaches the client bundle,
 * so reading the site's JavaScript tells you nothing.
 */
function assertDesk(passcode: string) {
  const expected = process.env.DESK_PASSCODE;
  if (!expected) {
    throw new Error(
      'DESK_PASSCODE is not set on this deployment. Run: npx convex env set DESK_PASSCODE <passcode>',
    );
  }
  if (passcode !== expected) throw new Error('Not authorised — the desk passcode is wrong.');
}

/** Present on every mutation below. */
const desk = { passcode: v.string() };

const placing = v.object({
  teamId: v.string(),
  // Everyone named in the placing — all four legs of a relay.
  people: v.optional(v.array(v.string())),
});

const podium = v.array(v.number());

const eventFields = {
  name: v.string(),
  discipline: v.union(v.literal('game'), v.literal('athletics')),
  category: v.union(v.literal('men'), v.literal('women'), v.literal('mixed')),
  squad: v.string(),
  note: v.optional(v.string()),
  overall: podium,
  individual: v.optional(podium),
  crew: v.optional(v.number()),
};

/**
 * The whole meet in one subscription. It is a couple of hundred rows at most,
 * so one query keeps every page live without a fan-out of subscriptions.
 */
export const snapshot = query({
  args: {},
  handler: async (ctx) => {
    const [teams, events, results] = await Promise.all([
      ctx.db.query('teams').collect(),
      ctx.db.query('events').collect(),
      ctx.db.query('results').collect(),
    ]);

    return {
      teams: (teams.length ? teams : DEFAULT_TEAMS).map((t) => ({
        id: t.teamId,
        name: t.name,
        short: t.short,
        colorHex: t.colorHex,
      })),
      events: events
        .sort((a, b) => a.position - b.position)
        .map((e) => ({
          id: e.eventId,
          name: e.name,
          discipline: e.discipline,
          category: e.category,
          squad: e.squad,
          note: e.note,
          overall: e.overall,
          individual: e.individual,
          crew: e.crew,
        })),
      results: Object.fromEntries(
        results.map((r) => [r.eventId, { first: r.first, second: r.second, third: r.third }]),
      ),
    };
  },
});

/**
 * Lets the sign-in screen tell a wrong passcode from a right one without
 * writing anything. Deliberately returns a bare boolean and nothing else.
 */
export const checkPasscode = query({
  args: { passcode: v.string() },
  handler: (_ctx, { passcode }) => passcode === process.env.DESK_PASSCODE,
});

/**
 * First run against a fresh deployment. The client passes the programme from
 * src/data/catalog.ts so the printed sheet stays in one place.
 *
 * Left open deliberately: it only acts when the tables are empty, so the site
 * seeds itself for the first visitor rather than staying blank until someone
 * signs in. Once seeded it is a no-op.
 */
export const seed = mutation({
  args: {
    events: v.array(v.object({ eventId: v.string(), ...eventFields })),
  },
  handler: async (ctx, { events }) => {
    const teams = await ctx.db.query('teams').collect();
    if (teams.length === 0) {
      for (const team of DEFAULT_TEAMS) await ctx.db.insert('teams', team);
    }

    const existing = await ctx.db.query('events').collect();
    if (existing.length === 0) {
      let position = 0;
      for (const event of events) await ctx.db.insert('events', { ...event, position: position++ });
    }
  },
});

export const setResult = mutation({
  args: {
    ...desk,
    eventId: v.string(),
    first: v.optional(placing),
    second: v.optional(placing),
    third: v.optional(placing),
  },
  handler: async (ctx, { passcode, eventId, ...spots }) => {
    assertDesk(passcode);
    const existing = await ctx.db
      .query('results')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();

    // An entirely empty podium means "no result yet", not an empty row.
    if (!spots.first && !spots.second && !spots.third) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    if (existing) await ctx.db.replace(existing._id, { eventId, ...spots });
    else await ctx.db.insert('results', { eventId, ...spots });
  },
});

export const clearResult = mutation({
  args: { ...desk, eventId: v.string() },
  handler: async (ctx, { passcode, eventId }) => {
    assertDesk(passcode);
    const existing = await ctx.db
      .query('results')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const addEvent = mutation({
  args: { ...desk, eventId: v.string(), ...eventFields },
  handler: async (ctx, { passcode, ...args }) => {
    assertDesk(passcode);
    const all = await ctx.db.query('events').collect();
    const position = all.reduce((max, e) => Math.max(max, e.position), -1) + 1;
    await ctx.db.insert('events', { ...args, position });
  },
});

export const updateEvent = mutation({
  args: {
    ...desk,
    eventId: v.string(),
    name: v.optional(v.string()),
    discipline: v.optional(v.union(v.literal('game'), v.literal('athletics'))),
    category: v.optional(v.union(v.literal('men'), v.literal('women'), v.literal('mixed'))),
    squad: v.optional(v.string()),
    note: v.optional(v.string()),
    overall: v.optional(podium),
    // Explicit null clears the individual points; undefined leaves them alone.
    individual: v.optional(v.union(podium, v.null())),
    crew: v.optional(v.number()),
  },
  handler: async (ctx, { passcode, eventId, individual, ...patch }) => {
    assertDesk(passcode);
    const event = await ctx.db
      .query('events')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();
    if (!event) return;
    await ctx.db.patch(event._id, {
      ...patch,
      ...(individual === undefined ? {} : { individual: individual ?? undefined }),
    });
  },
});

export const removeEvent = mutation({
  args: { ...desk, eventId: v.string() },
  handler: async (ctx, { passcode, eventId }) => {
    assertDesk(passcode);
    const event = await ctx.db
      .query('events')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();
    if (event) await ctx.db.delete(event._id);

    // Its result would otherwise linger as an orphan.
    const result = await ctx.db
      .query('results')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();
    if (result) await ctx.db.delete(result._id);
  },
});

export const updateTeam = mutation({
  args: {
    ...desk,
    teamId: v.string(),
    name: v.optional(v.string()),
    short: v.optional(v.string()),
    colorHex: v.optional(v.string()),
  },
  handler: async (ctx, { passcode, teamId, ...patch }) => {
    assertDesk(passcode);
    const team = await ctx.db
      .query('teams')
      .withIndex('by_teamId', (q) => q.eq('teamId', teamId))
      .unique();
    if (team) await ctx.db.patch(team._id, patch);
  },
});

/** Replaces the programme with the printed sheet, keeping results intact. */
export const restoreProgramme = mutation({
  args: {
    ...desk,
    events: v.array(v.object({ eventId: v.string(), ...eventFields })),
  },
  handler: async (ctx, { passcode, events }) => {
    assertDesk(passcode);
    const existing = await ctx.db.query('events').collect();
    for (const row of existing) await ctx.db.delete(row._id);
    let position = 0;
    for (const event of events) await ctx.db.insert('events', { ...event, position: position++ });
  },
});

export const resetResults = mutation({
  args: { ...desk },
  handler: async (ctx, { passcode }) => {
    assertDesk(passcode);
    const rows = await ctx.db.query('results').collect();
    for (const row of rows) await ctx.db.delete(row._id);
  },
});
