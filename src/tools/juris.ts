import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { JurisClient } from '../client.js';
import { JurisSearchArgs } from '../types.js';

export const jurisSearchToolDefinition: Tool = {
  name: 'juris_search',
  description: 'Search for similar patents. Provide description, optional title, inventor, and flags.',
  inputSchema: {
    type: 'object',
    properties: {
      description: { type: 'string' },
      title: { type: ['string', 'null'] },
      inventor: { type: ['string', 'null'] },
      use_web_search: { type: 'boolean' },
      use_local_corpus: { type: 'boolean' },
      max_local_results: { type: 'number' },
      max_web_results: { type: 'number' }
    },
    required: ['description']
  }
};

function isJurisSearchArgs(args: unknown): args is JurisSearchArgs {
  return !!args && typeof args === 'object' && 'description' in args && typeof (args as any).description === 'string';
}

export async function handleJurisSearchTool(client: JurisClient, args: unknown): Promise<CallToolResult> {
  try {
    if (!isJurisSearchArgs(args)) {
      throw new Error('Invalid arguments for juris_search');
    }
    const result = await client.search(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true
    };
  }
}


