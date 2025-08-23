export type OrchestratorRequest = {
  query: string;
  user_id?: string | null;
  context?: Record<string, unknown> | null;
};

export type AgentResponse = {
  agent_name: string;
  agent_description: string;
  input_query: string;
  output_response: Record<string, unknown>;
  success: boolean;
  error_message?: string | null;
};

export type OrchestratorResponse = {
  query: string;
  selected_agent: "lexi" | "juris" | "filora";
  agent_description: string;
  reasoning: string;
  agent_response: AgentResponse;
  execution_time: number;
};

export async function postOrchestrator(body: OrchestratorRequest): Promise<OrchestratorResponse> {
  const res = await fetch("/api/orchestrator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.json();
    } catch {}
    throw new Error(
      `Orchestrator failed: ${res.status} ${res.statusText}` +
        (details ? ` - ${JSON.stringify(details)}` : "")
    );
  }

  return (await res.json()) as OrchestratorResponse;
}
