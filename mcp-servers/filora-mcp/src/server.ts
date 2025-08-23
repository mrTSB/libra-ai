import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, InitializedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { FiloraClient } from './client.js';
import { filoraActionTool, filoraFillFormTool, filoraClickElementTool, filoraExtractDataTool, handleFiloraTool } from './tools/index.js';

export function createStandaloneServer(baseUrl: string): Server {
  const server = new Server(
    { name: 'org/filora', version: '0.2.0' },
    { capabilities: { tools: {} } }
  );
  const client = new FiloraClient(baseUrl);

  server.setNotificationHandler(InitializedNotificationSchema, async () => {
    console.log('Filora MCP client initialized');
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [filoraActionTool, filoraFillFormTool, filoraClickElementTool, filoraExtractDataTool]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await handleFiloraTool(client, name, args);
  });

  return server;
}

export class FiloraServer {
  constructor(private readonly baseUrl: string) {}
  getServer(): Server {
    return createStandaloneServer(this.baseUrl);
  }
}
