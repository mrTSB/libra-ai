import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, InitializedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { JurisClient } from './client.js';
import { jurisSearchTool, jurisSearchLocalTool, jurisStatusTool, handleJurisTool } from './tools/index.js';

export function createStandaloneServer(baseUrl: string): Server {
  const server = new Server(
    { name: 'org/juris', version: '0.2.0' },
    { capabilities: { tools: {} } }
  );
  const client = new JurisClient(baseUrl);

  server.setNotificationHandler(InitializedNotificationSchema, async () => {
    console.log('Juris MCP client initialized');
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [jurisSearchTool, jurisSearchLocalTool, jurisStatusTool]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await handleJurisTool(client, name, args);
  });

  return server;
}

export class JurisServer {
  constructor(private readonly baseUrl: string) {}
  getServer(): Server {
    return createStandaloneServer(this.baseUrl);
  }
}
