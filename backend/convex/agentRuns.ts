import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a run to a specific agent
export const addRunToAgent = mutation({
  args: { 
    agentNumber: v.number(), 
    run: v.any() 
  },
  handler: async (ctx, args) => {
    const { agentNumber, run } = args;
    
    // Validate agent number is between 1 and 6
    if (agentNumber < 1 || agentNumber > 6) {
      throw new Error("Agent number must be between 1 and 6");
    }

    // Check if agent record already exists
    const existingAgent = await ctx.db
      .query("agentRuns")
      .withIndex("by_agent_number", (q) => q.eq("agentNumber", agentNumber))
      .first();

    const timestamp = Date.now();

    if (existingAgent) {
      // Add run to existing agent
      const updatedRuns = [...existingAgent.runs, run];
      await ctx.db.patch(existingAgent._id, {
        runs: updatedRuns,
        updatedAt: timestamp,
      });
      return existingAgent._id;
    } else {
      // Create new agent record
      const id = await ctx.db.insert("agentRuns", {
        agentNumber,
        runs: [run],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return id;
    }
  },
});

// Get all runs for a specific agent
export const getRunsByAgent = query({
  args: { agentNumber: v.number() },
  handler: async (ctx, args) => {
    const { agentNumber } = args;
    
    // Validate agent number is between 1 and 6
    if (agentNumber < 1 || agentNumber > 6) {
      throw new Error("Agent number must be between 1 and 6");
    }

    const agent = await ctx.db
      .query("agentRuns")
      .withIndex("by_agent_number", (q) => q.eq("agentNumber", agentNumber))
      .first();

    return agent ? agent.runs : [];
  },
});

// Get all agents and their run counts
export const getAllAgentsStats = query({
  args: {},
  handler: async (ctx) => {
    const allAgents = await ctx.db.query("agentRuns").collect();
    
    return allAgents.map(agent => ({
      agentNumber: agent.agentNumber,
      runCount: agent.runs.length,
      lastUpdated: new Date(agent.updatedAt).toISOString(),
    }));
  },
});

// Clear all runs for a specific agent
export const clearAgentRuns = mutation({
  args: { agentNumber: v.number() },
  handler: async (ctx, args) => {
    const { agentNumber } = args;
    
    // Validate agent number is between 1 and 6
    if (agentNumber < 1 || agentNumber > 6) {
      throw new Error("Agent number must be between 1 and 6");
    }

    const agent = await ctx.db
      .query("agentRuns")
      .withIndex("by_agent_number", (q) => q.eq("agentNumber", agentNumber))
      .first();

    if (agent) {
      await ctx.db.patch(agent._id, {
        runs: [],
        updatedAt: Date.now(),
      });
      return true;
    }
    
    return false;
  },
});

// Get the latest run for a specific agent
export const getLatestRunByAgent = query({
  args: { agentNumber: v.number() },
  handler: async (ctx, args) => {
    const { agentNumber } = args;
    
    // Validate agent number is between 1 and 6
    if (agentNumber < 1 || agentNumber > 6) {
      throw new Error("Agent number must be between 1 and 6");
    }

    const agent = await ctx.db
      .query("agentRuns")
      .withIndex("by_agent_number", (q) => q.eq("agentNumber", agentNumber))
      .first();

    if (agent && agent.runs.length > 0) {
      return agent.runs[agent.runs.length - 1];
    }
    
    return null;
  },
});
