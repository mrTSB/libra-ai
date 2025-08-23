import { mutation, query, action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Mutation to store a document with its embedding
export const insertDocument = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      content: args.content,
      embedding: args.embedding,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

// Mutation to batch insert multiple documents (more efficient)
export const batchInsertDocuments = mutation({
  args: {
    documents: v.array(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    const insertPromises = args.documents.map(doc => 
      ctx.db.insert("documents", {
        ...doc,
        createdAt: Date.now(),
      })
    );
    
    return await Promise.all(insertPromises);
  },
});

// Query to get documents count
export const getDocumentsCount = query({
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();
    return documents.length;
  },
});

// Helper query to get a document by ID (used by the action)
export const getDocumentsByIds = internalQuery({
  args: { ids: v.array(v.id("documents")) },
  handler: async (ctx, args) => {
    const results: any[] = [];
    for (const id of args.ids) {
      const doc = await ctx.db.get(id);
      if (doc) results.push(doc);
    }
    return results;
  },
});

// Action to search documents by vector similarity (vector search only available in actions)
export const searchDocuments = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    
    try {
      // Use the proper Convex vector search API
      const vectorResults: any[] = await ctx.vectorSearch("documents", "by_embedding", {
        vector: args.embedding,
        limit: Math.min(limit * 3, 100), // Get more candidates for better selection
      });
      
      console.log(`Vector search returned ${vectorResults.length} results`);
      
      // Load the actual documents using the IDs from vector search in one call
      const ids: any[] = vectorResults.map((r: any) => r._id);
      const docs: any[] = await ctx.runQuery(internal.documents.getDocumentsByIds, { ids });
      const scoreById = new Map(ids.map((id: any, i: number) => [id, (vectorResults[i] as any)._score]));
      const documents: any[] = docs.map((doc: any) => ({
        _id: doc._id,
        content: doc.content,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
        score: scoreById.get(doc._id) ?? null,
      }));
      
      // Sort by score and return top N
      documents.sort((a: any, b: any) => ((b.score || 0) as number) - ((a.score || 0) as number));
      const topResults: any[] = documents.slice(0, limit);
      
      console.log(`Returning ${topResults.length} top results with scores`);
      return topResults;
      
    } catch (error) {
      console.error("Vector search error:", error);
      throw error; // Let the client handle the error
    }
  },
});

// Query to get document by original index (for debugging)
export const getDocumentByIndex = query({
  args: { originalIndex: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_original_index", (q) =>
        q.eq("metadata.originalIndex", args.originalIndex)
      )
      .first();
  },
});

// Query to get recent documents
export const getRecentDocuments = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_created_at")
      .order("desc")
      .take(args.limit || 10);
  },
});
