import { NextResponse } from "next/server";

const JURIS_BACKEND_URL = process.env.JURIS_BACKEND_URL || "http://localhost:8001";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${JURIS_BACKEND_URL}/patent/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: body.description,
        title: body.title ?? null,
        inventor: body.inventor ?? null,
        use_web_search: body.use_web_search,
        use_local_corpus: body.use_local_corpus,
        max_local_results: body.max_local_results,
        max_web_results: body.max_web_results,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Juris backend error", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to contact Juris backend", details: String(error) },
      { status: 500 }
    );
  }
}
