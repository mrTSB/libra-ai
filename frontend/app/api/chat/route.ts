import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, smoothStream, stepCountIs, streamText, tool, UIMessage } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-5-mini"),
    system:
      "You are a helpful writing assistant. You have a file open in front of you. You can edit the file using the write_diff tool.",
    messages: convertToModelMessages(messages),
    providerOptions: {
      openai: {
        reasoningSummary: "auto",
      },
    },
    experimental_transform: smoothStream({
      delayInMs: 10,
    }),
    tools: {
      write_diff: tool({
        description: "Edit the file using a diff.",
        inputSchema: z.object({
          oldText: z.string().describe("Original text to compare."),
          newText: z.string().describe("Proposed updated text."),
        }),
      }),
    },
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
