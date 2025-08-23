import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FiloraClient } from '../client.js';
import { ActionRequestArgs, FillFormArgs, ClickElementArgs, ExtractDataArgs } from '../types.js';

export const filoraActionTool: Tool = {
  name: 'filora_action',
  description: 'Execute a browser automation action (navigate, click, fill form, extract, custom).',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      action_type: { type: 'string', enum: ['fill_form', 'click', 'extract', 'navigate', 'custom'] },
      data: { type: 'object' },
      instructions: { type: 'string' },
      timeout: { type: 'number' }
    },
    required: ['url', 'action_type']
  }
};

export const filoraFillFormTool: Tool = {
  name: 'filora_fill_form',
  description: 'Fill and optionally submit a form on a web page.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      form_data: { type: 'array', items: { type: 'object' } },
      submit: { type: 'boolean' }
    },
    required: ['url', 'form_data']
  }
};

export const filoraClickElementTool: Tool = {
  name: 'filora_click_element',
  description: 'Click an element on a web page by selector.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      selector: { type: 'string' },
      description: { type: 'string' }
    },
    required: ['url', 'selector']
  }
};

export const filoraExtractDataTool: Tool = {
  name: 'filora_extract_data',
  description: 'Extract structured data from a web page by CSS selectors.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      selectors: { type: 'object' },
      instructions: { type: 'string' }
    },
    required: ['url', 'selectors']
  }
};

function isActionArgs(a: unknown): a is ActionRequestArgs {
  return !!a && typeof a === 'object' && typeof (a as any).url === 'string' && typeof (a as any).action_type === 'string';
}

export async function handleFiloraTool(client: FiloraClient, name: string, args: unknown): Promise<CallToolResult> {
  try {
    switch (name) {
      case 'filora_action': {
        if (!isActionArgs(args)) throw new Error('Invalid arguments for filora_action');
        const result = await client.action(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      }
      case 'filora_fill_form': {
        const result = await client.fillForm(args as FillFormArgs);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      }
      case 'filora_click_element': {
        const result = await client.clickElement(args as ClickElementArgs);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      }
      case 'filora_extract_data': {
        const result = await client.extractData(args as ExtractDataArgs);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
  }
}
