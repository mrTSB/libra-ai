import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { LexiClient } from './client.js';
import {
    legalChatToolDefinition,
    handleLegalChatTool,
} from './tools/index.js';

export function createStandaloneServer(backendUrl?: string): Server {
    const serverInstance = new Server(
        {
            name: "lexi-legal-assistant",
            version: "0.1.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    const lexiClient = new LexiClient(backendUrl);

    serverInstance.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [legalChatToolDefinition],
    }));

    serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        
        switch (name) {
            case "lexi_legal_chat":
                return await handleLegalChatTool(lexiClient, args);
            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    });

    return serverInstance;
}

export class LexiServer {
    private backendUrl?: string;

    constructor(backendUrl?: string) {
        this.backendUrl = backendUrl;
    }

    getServer(): Server {
        return createStandaloneServer(this.backendUrl);
    }
}
