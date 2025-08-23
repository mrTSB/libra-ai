import { NextResponse } from "next/server";

const FILORA_BACKEND_URL = process.env.FILORA_BACKEND_URL || "http://localhost:8003";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Primary unified endpoint
    let response = await fetch(`${FILORA_BACKEND_URL}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {}

    // Fallback: call legacy endpoints when route/method not supported
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      const actionType: string | undefined = body?.action_type || body?.actionType;
      const url: string | undefined = body?.url;
      const d = body?.data;

      if (actionType === "fill_form") {
        const formDataArray = (() => {
          if (Array.isArray(d)) {
            return d.map((it) => ({
              name: String(it?.name ?? ""),
              value: String(it?.value ?? ""),
            }));
          }
          if (d && typeof d === "object") {
            if (Array.isArray(d.form_fields)) {
              return d.form_fields.map((it: any) => ({
                name: String(it?.name ?? ""),
                value: String(it?.value ?? ""),
              }));
            }
            if (Array.isArray(d.form_data)) {
              return d.form_data.map((it: any) => ({
                name: String(it?.name ?? ""),
                value: String(it?.value ?? ""),
              }));
            }
            return Object.entries(d)
              .filter(([k]) => k !== "submit")
              .map(([k, v]) => ({ name: String(k), value: v == null ? "" : String(v) }));
          }
          return [] as Array<{ name: string; value: string }>;
        })();

        const legacyBody = { url, form_data: formDataArray, submit: Boolean(d?.submit ?? false) };
        response = await fetch(`${FILORA_BACKEND_URL}/fill-form`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(legacyBody),
          cache: "no-store",
        });
        try {
          data = await response.json();
        } catch {}
      } else if (actionType === "click") {
        const legacyBody = { url, selector: d?.selector, description: d?.description };
        response = await fetch(`${FILORA_BACKEND_URL}/click-element`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(legacyBody),
          cache: "no-store",
        });
        try {
          data = await response.json();
        } catch {}
      } else if (actionType === "extract") {
        const legacyBody = { url, selectors: d?.selectors || {} };
        response = await fetch(`${FILORA_BACKEND_URL}/extract-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(legacyBody),
          cache: "no-store",
        });
        try {
          data = await response.json();
        } catch {}
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Filora backend error", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to contact Filora backend", details: String(error) },
      { status: 500 }
    );
  }
}
