import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, smoothStream, streamText, UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-5-nano"),
    system: "You are a helpful assistant.",
    messages: convertToModelMessages(messages),
    providerOptions: {
      openai: {
        reasoningSummary: "auto",
      },
    },
    experimental_transform: smoothStream({
      delayInMs: 10,
    }),
  });

  return result.toUIMessageStreamResponse();
}
