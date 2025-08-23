import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { JurisClient } from '../client.js';
import { PatentSearchArgs } from '../types.js';

export const jurisSearchTool: Tool = {
  name: 'juris_search',
  description: 'Search for similar patents using local corpus and web search.',
  inputSchema: {
    type: 'object',
    properties: {
      description: { type: 'string', description: 'Description of the invention' },
      title: { type: 'string' },
      inventor: { type: 'string' },
      use_web_search: { type: 'boolean', default: true },
      use_local_corpus: { type: 'boolean', default: true },
      max_local_results: { type: 'number', default: 5 },
      max_web_results: { type: 'number', default: 5 }
    },
    required: ['description']
  }
};

export const jurisSearchLocalTool: Tool = {
  name: 'juris_search_local',
  description: 'Search only the local patent corpus for similar patents.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Query string for local search' },
      max_results: { type: 'number', default: 5 }
    },
    required: ['query']
  }
};

export const jurisStatusTool: Tool = {
  name: 'juris_status',
  description: 'Get Juris system status.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false }
};

function isPatentSearchArgs(a: unknown): a is PatentSearchArgs {
  return !!a && typeof a === 'object' && typeof (a as any).description === 'string';
}

export async function handleJurisTool(client: JurisClient, name: string, args: unknown): Promise<CallToolResult> {
  try {
    switch (name) {
      case 'juris_search': {
        if (!isPatentSearchArgs(args)) throw new Error('Invalid arguments for juris_search');
        const result = await client.searchPatents(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      }
      case 'juris_search_local': {
        if (!args || typeof (args as any).query !== 'string') throw new Error('Invalid arguments for juris_search_local');
        const { query, max_results } = args as { query: string; max_results?: number };
        const result = await client.searchLocal(query, max_results ?? 5);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      }
      case 'juris_status': {
        const result = await client.status();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true
    };
  }
}
