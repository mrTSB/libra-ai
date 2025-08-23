import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DonnaClient } from '../client.js';
import { DonnaWorkflowArgs } from '../types.js';

export const donnaWorkflowTool: Tool = {
  name: 'donna_run_workflow',
  description: 'Run a Donna email workflow; returns streamed text concatenated.',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      title: { type: 'string' },
      send_email: { type: 'boolean' }
    },
    required: ['message', 'title']
  }
};

function isArgs(a: unknown): a is DonnaWorkflowArgs {
  return !!a && typeof a === 'object' && typeof (a as any).message === 'string' && typeof (a as any).title === 'string';
}

export async function handleDonnaTool(client: DonnaClient, name: string, args: unknown): Promise<CallToolResult> {
  try {
    switch (name) {
      case 'donna_run_workflow': {
        if (!isArgs(args)) throw new Error('Invalid arguments for donna_run_workflow');
        const output = await client.runWorkflow(args);
        return { content: [{ type: 'text', text: output }], isError: false };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
  }
}
