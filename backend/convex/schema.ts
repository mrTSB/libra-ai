import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agentRuns: defineTable({
    agentNumber: v.number(),
    runs: v.array(v.any()), // Store JSON data as any type
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_agent_number", ["agentNumber"]),
});
