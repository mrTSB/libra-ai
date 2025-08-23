import { NextResponse } from "next/server";

const SAGE_BACKEND_URL = process.env.SAGE_BACKEND_URL || "http://localhost:8002";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${SAGE_BACKEND_URL}/sage/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Sage backend error", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to contact Sage backend", details: String(error) },
      { status: 500 }
    );
  }
}
