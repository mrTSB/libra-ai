import { NextResponse } from "next/server";

const SAGE_BACKEND_URL = process.env.SAGE_BACKEND_URL || "http://localhost:8002";

export async function GET(_req: Request, { params }: { params: { chatId: string } }) {
  try {
    const response = await fetch(
      `${SAGE_BACKEND_URL}/sage/get_chat?chat_id=${encodeURIComponent(params.chatId)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

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
