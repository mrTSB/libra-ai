import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    InitializedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { LibraAIClient } from './client.js';
import {
    lexiChatToolDefinition,
    handleLexiChatTool,
    jurisPatentSearchToolDefinition,
    handleJurisPatentSearchTool,
} from './tools/index.js';

export function createStandaloneServer(lexiBackendUrl: string, jurisBackendUrl: string): Server {
    const serverInstance = new Server(
        {
            name: "org/libra-ai",
            version: "0.2.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    const libraClient = new LibraAIClient(lexiBackendUrl, jurisBackendUrl);

    serverInstance.setNotificationHandler(InitializedNotificationSchema, async () => {
        console.log('Libra AI MCP client initialized');
    });

    serverInstance.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            lexiChatToolDefinition,
            jurisPatentSearchToolDefinition,
        ],
    }));

    serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        
        switch (name) {
            case "lexi_legal_chat":
                return await handleLexiChatTool(libraClient, args);
            case "juris_patent_search":
                return await handleJurisPatentSearchTool(libraClient, args);
            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    });

    return serverInstance;
}

export class LibraAIServer {
    private lexiBackendUrl: string;
    private jurisBackendUrl: string;

    constructor(lexiBackendUrl: string, jurisBackendUrl: string) {
        this.lexiBackendUrl = lexiBackendUrl;
        this.jurisBackendUrl = jurisBackendUrl;
    }

    getServer(): Server {
        return createStandaloneServer(this.lexiBackendUrl, this.jurisBackendUrl);
    }
}
