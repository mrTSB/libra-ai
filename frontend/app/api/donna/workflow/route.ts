import { NextResponse } from "next/server";

const DONNA_BACKEND_URL = process.env.DONNA_BACKEND_URL || "http://localhost:8004";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const controller = new AbortController();

    const upstream = await fetch(`${DONNA_BACKEND_URL}/donna/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!upstream.ok || !upstream.body) {
      let data: any = null;
      try {
        data = await upstream.json();
      } catch {}
      return NextResponse.json(
        { error: data?.error || "Donna backend error", details: data },
        { status: upstream.status || 500 }
      );
    }

    const stream = new ReadableStream({
      async start(controllerStream) {
        const reader = upstream.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) controllerStream.enqueue(value);
          }
        } catch (err) {
          // swallow; client likely disconnected
        } finally {
          controllerStream.close();
        }
      },
      cancel() {
        controller.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Allow browser to connect from same nextjs origin
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to contact Donna backend", details: String(error) },
      { status: 500 }
    );
  }
}
