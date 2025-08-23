import { NextResponse } from "next/server";

const LEXI_BACKEND_URL = process.env.LEXI_BACKEND_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${LEXI_BACKEND_URL}/legal/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // don't cache dynamic API proxy
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Lexi backend error", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to contact Lexi backend", details: String(error) },
      { status: 500 }
    );
  }
}
