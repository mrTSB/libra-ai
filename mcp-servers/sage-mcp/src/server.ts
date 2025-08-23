import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, InitializedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { SageClient } from './client.js';
import { sageChatTool, sageGetChatsTool, sageGetChatTool, handleSageTool } from './tools/index.js';

export function createStandaloneServer(baseUrl: string): Server {
  const server = new Server(
    { name: 'org/sage', version: '0.2.0' },
    { capabilities: { tools: {} } }
  );
  const client = new SageClient(baseUrl);

  server.setNotificationHandler(InitializedNotificationSchema, async () => {
    console.log('Sage MCP client initialized');
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [sageChatTool, sageGetChatsTool, sageGetChatTool]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await handleSageTool(client, name, args);
  });

  return server;
}

export class SageServer {
  constructor(private readonly baseUrl: string) {}
  getServer(): Server {
    return createStandaloneServer(this.baseUrl);
  }
}

