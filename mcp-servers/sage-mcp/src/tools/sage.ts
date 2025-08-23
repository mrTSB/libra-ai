import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SageClient } from '../client.js';
import { SageChatArgs } from '../types.js';

export const sageChatTool: Tool = {
  name: 'sage_chat',
  description: 'Chat with Sage (legal assistant with web and email RAG).',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      use_web_search: { type: 'boolean' },
      model_name: { type: 'string' },
      temperature: { type: 'number' },
      chat_id: { type: 'string' }
    },
    required: ['prompt']
  }
};

export const sageGetChatsTool: Tool = {
  name: 'sage_get_chats',
  description: 'List Sage chats (id and title).',
  inputSchema: {
    type: 'object',
    properties: { limit: { type: 'number' } },
    additionalProperties: false
  }
};

export const sageGetChatTool: Tool = {
  name: 'sage_get_chat',
  description: 'Get a single chat by id with messages.',
  inputSchema: {
    type: 'object',
    properties: { chat_id: { type: 'string' } },
    required: ['chat_id']
  }
};

function isSageChatArgs(a: unknown): a is SageChatArgs {
  return !!a && typeof a === 'object' && typeof (a as any).prompt === 'string';
}

export async function handleSageTool(client: SageClient, name: string, args: unknown): Promise<CallToolResult> {
  try {
    switch (name) {
      case 'sage_chat': {
        if (!isSageChatArgs(args)) throw new Error('Invalid arguments for sage_chat');
        const result = await client.chat(args);
        // If the response includes text, return it; otherwise JSON
        const textLike = (result && typeof result.text === 'string') ? result.text : null;
        const text = textLike ?? JSON.stringify(result, null, 2);
        return { content: [{ type: 'text', text }], isError: false };
      }
      case 'sage_get_chats': {
        const { limit } = (args || {}) as { limit?: number };
        const result = await client.listChats(limit);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      }
      case 'sage_get_chat': {
        if (!args || typeof (args as any).chat_id !== 'string') throw new Error('Invalid arguments for sage_get_chat');
        const { chat_id } = args as { chat_id: string };
        const result = await client.getChat(chat_id);
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


