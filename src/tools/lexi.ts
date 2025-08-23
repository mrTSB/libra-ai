import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { LibraAIClient } from '../client.js';
import { LexiChatArgs } from '../types.js';

/**
 * Tool definition for Lexi legal chat
 */
export const lexiChatToolDefinition: Tool = {
    name: "lexi_legal_chat",
    description: "Ask legal questions and get comprehensive answers using both local legal documents and web search. This tool provides legal information and analysis but is not legal advice.",
    inputSchema: {
        type: "object",
        properties: {
            question: {
                type: "string",
                description: "The legal question to ask"
            },
            use_web_search: {
                type: "boolean",
                description: "Whether to include web search results in the analysis (default: true)",
                default: true
            },
            use_local_docs: {
                type: "boolean", 
                description: "Whether to search local legal documents (default: true)",
                default: true
            },
            max_local_results: {
                type: "number",
                description: "Maximum number of local document results to include (default: 5)",
                default: 5,
                minimum: 1,
                maximum: 20
            },
            max_web_results: {
                type: "number",
                description: "Maximum number of web search results to include (default: 3)", 
                default: 3,
                minimum: 1,
                maximum: 10
            }
        },
        required: ["question"],
    },
};

/**
 * Type guard for Lexi chat arguments
 */
function isLexiChatArgs(args: unknown): args is LexiChatArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "question" in args &&
        typeof (args as { question: unknown }).question === "string" &&
        (args as { question: string }).question.trim().length > 0
    );
}

/**
 * Handles Lexi legal chat tool calls
 */
export async function handleLexiChatTool(
    client: LibraAIClient, 
    args: unknown
): Promise<CallToolResult> {
    try {
        if (!args) {
            throw new Error("No arguments provided");
        }

        if (!isLexiChatArgs(args)) {
            throw new Error("Invalid arguments for lexi_legal_chat. Required: question (string)");
        }

        // Set defaults for optional parameters
        const lexiArgs: LexiChatArgs = {
            question: args.question.trim(),
            use_web_search: args.use_web_search ?? true,
            use_local_docs: args.use_local_docs ?? true,
            max_local_results: args.max_local_results ?? 5,
            max_web_results: args.max_web_results ?? 3,
        };

        // Validate question length
        if (lexiArgs.question.length < 5) {
            throw new Error("Question must be at least 5 characters long");
        }

        const result = await client.performLegalChat(lexiArgs);
        
        return {
            content: [{ type: "text", text: result }],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error in legal chat: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
