export type FiloraActionRequest = {
  url: string;
  action_type: "fill_form" | string;
  data: Record<string, unknown>;
  instructions: string;
  timeout: number;
};

export type FiloraLocation = {
  x: number;
  y: number;
  selector: string;
  tag_name: string;
  text_content: string;
  attributes: Record<string, string>;
};

export type FiloraActionResponse = {
  task_id: string;
  status: string;
  result: Record<string, unknown> | null;
  screenshots: string[];
  execution_time: number;
  message: string;
  error?: string | null;
  locations: FiloraLocation[];
  summary: string[];
};

export async function postFiloraAction(body: FiloraActionRequest): Promise<FiloraActionResponse> {
  const res = await fetch("/api/filora/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.json();
    } catch {}
    throw new Error(
      `Filora action failed: ${res.status} ${res.statusText}` +
        (details ? ` - ${JSON.stringify(details)}` : "")
    );
  }

  return (await res.json()) as FiloraActionResponse;
}
