import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const DEFAULT_TEAMS = [
  { teamId: 'pg-phd', name: 'PG & PhD', short: 'PG', colorHex: '#A855F7' },
  { teamId: 'batch-22', name: "'22 Batch", short: "'22", colorHex: '#7FC6FF' },
  { teamId: 'batch-23', name: "'23 Batch", short: "'23", colorHex: '#2FB673' },
  { teamId: 'batch-24', name: "'24 Batch", short: "'24", colorHex: '#F7CE5B' },
  { teamId: 'batch-25', name: "'25 Batch", short: "'25", colorHex: '#C4562C' },
];

const placing = v.object({
  teamId: v.string(),
  athlete: v.optional(v.string()),
});

/**
 * The whole meet in one subscription. It is a few dozen rows at most, so one
 * query keeps every page live without a fan-out of per-page subscriptions.
 */
export const snapshot = query({
  args: {},
  handler: async (ctx) => {
    const [teams, results, fixtures] = await Promise.all([
      ctx.db.query('teams').collect(),
      ctx.db.query('results').collect(),
      ctx.db.query('fixtures').collect(),
    ]);

    return {
      teams: (teams.length ? teams : DEFAULT_TEAMS).map((t) => ({
        id: t.teamId,
        name: t.name,
        short: t.short,
        colorHex: t.colorHex,
      })),
      results: Object.fromEntries(
        results.map((r) => [r.eventId, { first: r.first, second: r.second, third: r.third }]),
      ),
      fixtures: Object.fromEntries(
        fixtures.map((f) => [f.eventId, { date: f.date, time: f.time, venue: f.venue }]),
      ),
    };
  },
});

export const seedTeams = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('teams').collect();
    if (existing.length > 0) return;
    for (const team of DEFAULT_TEAMS) await ctx.db.insert('teams', team);
  },
});

export const setResult = mutation({
  args: {
    eventId: v.string(),
    first: v.optional(placing),
    second: v.optional(placing),
    third: v.optional(placing),
  },
  handler: async (ctx, { eventId, ...podium }) => {
    const existing = await ctx.db
      .query('results')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();

    // An entirely empty podium means "no result yet", not an empty row.
    const isEmpty = !podium.first && !podium.second && !podium.third;
    if (isEmpty) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    if (existing) await ctx.db.replace(existing._id, { eventId, ...podium });
    else await ctx.db.insert('results', { eventId, ...podium });
  },
});

export const clearResult = mutation({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const existing = await ctx.db
      .query('results')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const setFixture = mutation({
  args: {
    eventId: v.string(),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    venue: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, ...details }) => {
    const existing = await ctx.db
      .query('fixtures')
      .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
      .unique();

    const isEmpty = !details.date && !details.time && !details.venue;
    if (isEmpty) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    if (existing) await ctx.db.replace(existing._id, { eventId, ...details });
    else await ctx.db.insert('fixtures', { eventId, ...details });
  },
});

export const updateTeam = mutation({
  args: {
    teamId: v.string(),
    name: v.optional(v.string()),
    short: v.optional(v.string()),
    colorHex: v.optional(v.string()),
  },
  handler: async (ctx, { teamId, ...patch }) => {
    const team = await ctx.db
      .query('teams')
      .withIndex('by_teamId', (q) => q.eq('teamId', teamId))
      .unique();
    if (team) await ctx.db.patch(team._id, patch);
  },
});

/** Wipes results and fixtures but keeps the roster. Used between editions. */
export const resetAll = mutation({
  args: {},
  handler: async (ctx) => {
    for (const table of ['results', 'fixtures'] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
  },
});
