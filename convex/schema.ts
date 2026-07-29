import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const placing = v.object({
  teamId: v.string(),
  person: v.optional(v.string()),
});

const podium = v.array(v.number());

export default defineSchema({
  teams: defineTable({
    teamId: v.string(),
    name: v.string(),
    short: v.string(),
    colorHex: v.string(),
  }).index('by_teamId', ['teamId']),

  // The programme. Editable from the results desk, seeded from the printed
  // sheet in src/data/catalog.ts on first run.
  events: defineTable({
    eventId: v.string(),
    name: v.string(),
    discipline: v.union(v.literal('game'), v.literal('athletics')),
    category: v.union(v.literal('men'), v.literal('women'), v.literal('mixed')),
    squad: v.string(),
    note: v.optional(v.string()),
    overall: podium,
    individual: v.optional(podium),
    /** Keeps the programme in a stable, editable order. */
    position: v.number(),
  }).index('by_eventId', ['eventId']),

  results: defineTable({
    eventId: v.string(),
    first: v.optional(placing),
    second: v.optional(placing),
    third: v.optional(placing),
  }).index('by_eventId', ['eventId']),
});
