import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, InitializedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { LexiClient, JurisClient } from './client.js';
import { lexiChatToolDefinition, handleLexiChatTool, jurisSearchToolDefinition, handleJurisSearchTool } from './tools/index.js';
import { Config } from './config.js';

export function createStandaloneServer(config: Config): Server {
  const serverInstance = new Server(
    { name: 'org/libra', version: '0.2.0' },
    { capabilities: { tools: {} } }
  );

  const lexiClient = new LexiClient(config.lexiUrl);
  const jurisClient = new JurisClient(config.jurisUrl);

  serverInstance.setNotificationHandler(InitializedNotificationSchema, async () => {
    console.log('Libra MCP client initialized');
  });

  serverInstance.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [lexiChatToolDefinition, jurisSearchToolDefinition]
  }));

  serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
      case 'lexi_chat':
        return await handleLexiChatTool(lexiClient, args);
      case 'juris_search':
        return await handleJurisSearchTool(jurisClient, args);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  });

  return serverInstance;
}

export class LibraServer {
  private config: Config;
  constructor(config: Config) { this.config = config; }
  getServer(): Server { return createStandaloneServer(this.config); }
}


