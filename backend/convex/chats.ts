import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createChat = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("chats", {
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const addMessage = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.string(), // "user" | "assistant" | "system"
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const msgId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      createdAt: now,
    });
    // Update chat updatedAt
    await ctx.db.patch(args.chatId, { updatedAt: now });
    return msgId;
  },
});

export const getMessages = query({
  args: { chatId: v.id("chats"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 1000));
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .take(limit);
    return msgs.map((m) => ({
      _id: m._id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  },
});

export const getChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    return chat;
  },
});


