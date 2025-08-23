import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool, UIMessage } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-5-mini"),
    system:
      "You are a helpful writing assistant. You have a file open in front of you. When proposing edits to the document, always call the write_diff tool with {oldText, newText}. oldText must be an exact substring of the provided 'Current document content'. Do not output the entire updated document; use the tool instead. Use the function and do not claim you're done. Output as minimal of a diff as possible, don't rewrite the entire document.",
    messages: convertToModelMessages(messages),
    providerOptions: {
      openai: {
        reasoningSummary: "auto",
      },
    },
    // keep streaming simple to ensure tool parts are emitted clearly
    tools: {
      write_diff: tool({
        description: "Edit the file using a diff.",
        inputSchema: z.object({
          oldText: z.string().describe("Original text to compare."),
          newText: z.string().describe("Proposed updated text."),
        }),
      }),
    },
    stopWhen: stepCountIs(20),
  });

  return result.toUIMessageStreamResponse();
}
