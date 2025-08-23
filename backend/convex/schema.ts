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
  
  documents: defineTable({
    content: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.object({
      sender: v.optional(v.string()),
      recipient: v.optional(v.string()),
      subject: v.optional(v.string()),
      date: v.optional(v.string()),
      messageId: v.optional(v.string()),
      originalIndex: v.number(),
    }),
    createdAt: v.number(),
  })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // OpenAI text-embedding-3-small dimensions
    })
    .index("by_original_index", ["metadata.originalIndex"])
    .index("by_sender", ["metadata.sender"])
    .index("by_created_at", ["createdAt"]),

  chats: defineTable({
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_created_at", ["createdAt"]),

  messages: defineTable({
    chatId: v.id("chats"),
    role: v.string(), // "user" | "assistant" | "system"
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_chat", ["chatId", "createdAt"])
    .index("by_created_at", ["createdAt"]),
});
