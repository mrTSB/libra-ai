import { NextResponse } from "next/server";

const ORCHESTRATOR_BACKEND_URL = process.env.ORCHESTRATOR_BACKEND_URL || "http://localhost:8005";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch(`${ORCHESTRATOR_BACKEND_URL}/orchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Orchestrator backend error", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to contact Orchestrator backend", details: String(error) },
      { status: 500 }
    );
  }
}
