import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const placing = v.object({
  teamId: v.string(),
  athlete: v.optional(v.string()),
});

export default defineSchema({
  teams: defineTable({
    teamId: v.string(),
    name: v.string(),
    short: v.string(),
    colorHex: v.string(),
  }).index('by_teamId', ['teamId']),

  // One row per decided event. `eventId` is a slug from src/data/catalog.ts;
  // the programme itself is not stored, only its outcomes.
  results: defineTable({
    eventId: v.string(),
    first: v.optional(placing),
    second: v.optional(placing),
    third: v.optional(placing),
  }).index('by_eventId', ['eventId']),

  fixtures: defineTable({
    eventId: v.string(),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    venue: v.optional(v.string()),
  }).index('by_eventId', ['eventId']),
});
