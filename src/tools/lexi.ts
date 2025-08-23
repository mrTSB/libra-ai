import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { LexiClient } from '../client.js';
import { LexiChatArgs } from '../types.js';

export const lexiChatToolDefinition: Tool = {
  name: 'lexi_chat',
  description: 'Ask the Lexi legal expert. Fields: question, optional flags for search.',
  inputSchema: {
    type: 'object',
    properties: {
      question: { type: 'string' },
      use_web_search: { type: 'boolean' },
      use_local_docs: { type: 'boolean' },
      max_local_results: { type: 'number' },
      max_web_results: { type: 'number' }
    },
    required: ['question']
  }
};

function isLexiChatArgs(args: unknown): args is LexiChatArgs {
  return !!args && typeof args === 'object' && 'question' in args && typeof (args as any).question === 'string';
}

export async function handleLexiChatTool(client: LexiClient, args: unknown): Promise<CallToolResult> {
  try {
    if (!isLexiChatArgs(args)) {
      throw new Error('Invalid arguments for lexi_chat');
    }
    const result = await client.chat(args);
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


