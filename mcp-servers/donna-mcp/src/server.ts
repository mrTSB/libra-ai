import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, InitializedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { DonnaClient } from './client.js';
import { donnaWorkflowTool, handleDonnaTool } from './tools/index.js';

export function createStandaloneServer(baseUrl: string): Server {
  const server = new Server(
    { name: 'org/donna', version: '0.2.0' },
    { capabilities: { tools: {} } }
  );
  const client = new DonnaClient(baseUrl);

  server.setNotificationHandler(InitializedNotificationSchema, async () => {
    console.log('Donna MCP client initialized');
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [donnaWorkflowTool]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await handleDonnaTool(client, name, args);
  });

  return server;
}

export class DonnaServer {
  constructor(private readonly baseUrl: string) {}
  getServer(): Server {
    return createStandaloneServer(this.baseUrl);
  }
}
