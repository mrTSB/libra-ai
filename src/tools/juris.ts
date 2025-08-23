import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { LibraAIClient } from '../client.js';
import { JurisSearchArgs } from '../types.js';

/**
 * Tool definition for Juris patent search
 */
export const jurisPatentSearchToolDefinition: Tool = {
    name: "juris_patent_search",
    description: "Search for patents similar to a given description using both local patent corpus and web search. Returns ranked results with similarity scores, competitive landscape analysis, and concept visualization.",
    inputSchema: {
        type: "object",
        properties: {
            description: {
                type: "string",
                description: "Description of the patent/invention to search for similar patents"
            },
            title: {
                type: "string",
                description: "Optional title of the patent/invention"
            },
            inventor: {
                type: "string",
                description: "Optional inventor name"
            },
            use_web_search: {
                type: "boolean",
                description: "Whether to include web search for similar patents (default: true)",
                default: true
            },
            use_local_corpus: {
                type: "boolean",
                description: "Whether to search local patent corpus (default: true)",
                default: true
            },
            max_local_results: {
                type: "number",
                description: "Maximum number of local corpus results (default: 5)",
                default: 5,
                minimum: 1,
                maximum: 20
            },
            max_web_results: {
                type: "number",
                description: "Maximum number of web search results (default: 5)",
                default: 5,
                minimum: 1,
                maximum: 15
            }
        },
        required: ["description"],
    },
};

/**
 * Type guard for Juris patent search arguments
 */
function isJurisSearchArgs(args: unknown): args is JurisSearchArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "description" in args &&
        typeof (args as { description: unknown }).description === "string" &&
        (args as { description: string }).description.trim().length > 0
    );
}

/**
 * Handles Juris patent search tool calls
 */
export async function handleJurisPatentSearchTool(
    client: LibraAIClient, 
    args: unknown
): Promise<CallToolResult> {
    try {
        if (!args) {
            throw new Error("No arguments provided");
        }

        if (!isJurisSearchArgs(args)) {
            throw new Error("Invalid arguments for juris_patent_search. Required: description (string)");
        }

        // Set defaults for optional parameters
        const jurisArgs: JurisSearchArgs = {
            description: args.description.trim(),
            title: args.title?.trim() || undefined,
            inventor: args.inventor?.trim() || undefined,
            use_web_search: args.use_web_search ?? true,
            use_local_corpus: args.use_local_corpus ?? true,
            max_local_results: args.max_local_results ?? 5,
            max_web_results: args.max_web_results ?? 5,
        };

        // Validate description length
        if (jurisArgs.description.length < 10) {
            throw new Error("Patent description must be at least 10 characters long");
        }

        const result = await client.performPatentSearch(jurisArgs);
        
        return {
            content: [{ type: "text", text: result }],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error in patent search: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
