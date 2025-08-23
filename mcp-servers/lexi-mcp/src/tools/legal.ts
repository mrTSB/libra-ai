import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { LexiClient } from '../client.js';
import { LegalChatArgs } from '../types.js';

export const legalChatToolDefinition: Tool = {
    name: "lexi_legal_chat",
    description: "Ask legal questions and get expert legal advice with supporting citations from legal documents and web sources.",
    inputSchema: {
        type: "object",
        properties: {
            question: {
                type: "string",
                description: "The legal question to ask"
            },
            use_web_search: {
                type: "boolean",
                description: "Whether to use web search for current legal information",
                default: true
            },
            use_local_docs: {
                type: "boolean", 
                description: "Whether to search local legal documents",
                default: true
            },
            max_local_results: {
                type: "number",
                description: "Maximum number of local document results",
                default: 5
            },
            max_web_results: {
                type: "number",
                description: "Maximum number of web search results", 
                default: 3
            }
        },
        required: ["question"],
    },
};

function isLegalChatArgs(args: unknown): args is LegalChatArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "question" in args &&
        typeof (args as { question: unknown }).question === "string"
    );
}

export async function handleLegalChatTool(
    client: LexiClient,
    args: unknown
): Promise<CallToolResult> {
    try {
        if (!args) {
            throw new Error("No arguments provided");
        }
        if (!isLegalChatArgs(args)) {
            throw new Error("Invalid arguments for lexi_legal_chat");
        }

        const result = await client.performLegalChat(args);
        
        let formattedResponse = `**Legal Answer:**\n${result.answer}\n\n`;
        
        if (result.sources && result.sources.length > 0) {
            formattedResponse += `**Sources:**\n`;
            result.sources.forEach((source, index) => {
                formattedResponse += `${index + 1}. [${source.type}] ${source.title}\n`;
                if (source.source) {
                    formattedResponse += `   Source: ${source.source}\n`;
                }
                formattedResponse += `   Content: ${source.content.substring(0, 200)}...\n\n`;
            });
        }

        return {
            content: [{ type: "text", text: formattedResponse }],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
