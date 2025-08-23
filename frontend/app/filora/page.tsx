"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { postFiloraAction, type FiloraActionResponse, type FiloraLocation } from "@/lib/filora";
import { PointerLayer, Pointer, usePointer } from "@/components/pointer";

type FormState = {
  url: string;
  instructions: string;
  timeout: number;
  dataJson: string;
};

export default function FiloraPage() {
  const [form, setForm] = useState<FormState>({
    url: "https://example.com",
    instructions: "Fill out the signup form",
    timeout: 30,
    dataJson: JSON.stringify({ name: "John Doe", email: "john@example.com" }, null, 2),
  });
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<FiloraActionResponse | null>(null);
  const [lastRequestBody, setLastRequestBody] = useState<any | null>(null);

  const [currentShot, setCurrentShot] = useState<number>(0);
  const [playhead, setPlayhead] = useState<number>(0);
  const { x, y, thoughts, moveTo, setThoughts } = usePointer({ x: 24, y: 24, thoughts: null });

  const locations: FiloraLocation[] = response?.locations ?? [];
  const screenshotsRaw: string[] = useMemo(() => {
    if (response?.screenshots && Array.isArray(response.screenshots)) return response.screenshots;
    const r: any = response?.result;
    if (r && Array.isArray(r?.screenshots)) return r.screenshots as string[];
    if (r && Array.isArray(r?.images)) return r.images as string[];
    if (r && Array.isArray(r?.image_data)) return r.image_data as string[];
    return [] as string[];
  }, [response]);

  const normalizedScreenshots = useMemo(() => {
    function normalize(sc: string): string | null {
      const s = (sc || "").trim();
      if (!s) return null;
      if (s.startsWith("data:image/")) return s;
      // Photos are base64 strings; assume PNG unless header indicates JPEG
      const head = s.slice(0, 10);
      const mime = head.startsWith("/9j/") ? "image/jpeg" : "image/png";
      return `data:${mime};base64,${s}`;
    }
    return screenshotsRaw.map((sc) => normalize(sc));
  }, [screenshotsRaw]);

  // Only use valid screenshots for slides
  const usableScreenshots = useMemo(
    () => normalizedScreenshots.filter(Boolean) as string[],
    [normalizedScreenshots]
  );
  const slidesCount = useMemo(() => usableScreenshots.length, [usableScreenshots]);

  // Reset to first slide when new response arrives
  useEffect(() => {
    setCurrentShot(0);
    if (locations.length > 0) {
      const loc = locations[0];
      moveTo({ x: loc.x, y: loc.y, thoughts: `${loc.tag_name} ${loc.selector || ""}`.trim() });
      setPlayhead(0);
    } else {
      setThoughts(null);
      setPlayhead(0);
    }
  }, [response]);

  // Sync pointer to current slide if a matching location exists
  useEffect(() => {
    if (!locations.length) return;
    const i = Math.min(currentShot, locations.length - 1);
    const loc = locations[i];
    if (!loc) return;
    moveTo({ x: loc.x, y: loc.y, thoughts: `${loc.tag_name} ${loc.selector || ""}`.trim() });
    setPlayhead(i);
  }, [currentShot, locations, moveTo]);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      let data: Record<string, unknown> = {};
      try {
        const raw = form.dataJson.trim() ? (JSON.parse(form.dataJson) as unknown) : {};
        if (Array.isArray(raw)) {
          const obj: Record<string, unknown> = {};
          for (const item of raw) {
            if (
              item &&
              typeof item === "object" &&
              Object.prototype.hasOwnProperty.call(item, "name")
            ) {
              const key = String((item as any).name);
              obj[key] = (item as any).value;
            } else {
              throw new Error("If JSON is an array, it must be an array of {name, value} objects");
            }
          }
          data = obj;
        } else if (raw && typeof raw === "object") {
          data = raw as Record<string, unknown>;
        } else {
          throw new Error("Form Data must be a JSON object or an array of {name, value}");
        }
      } catch (e: any) {
        throw new Error(e?.message || "Invalid JSON in Form Data");
      }

      const requestBody = {
        url: form.url,
        action_type: "fill_form",
        data,
        instructions: form.instructions,
        timeout: form.timeout,
      };
      setLastRequestBody(requestBody);
      const res = await postFiloraAction(requestBody);
      setResponse(res);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Prefill from query params and optionally auto-run
  useEffect(() => {
    const qp = Object.fromEntries(params.entries());
    const next: Partial<FormState> = {};
    if (qp.url) next.url = qp.url;
    if (qp.instructions) next.instructions = qp.instructions;
    if (qp.timeout) {
      const t = Number(qp.timeout);
      if (!Number.isNaN(t) && t > 0) next.timeout = t;
    }
    if (qp.data || qp.form_data) {
      // prefer "data" param; fallback to form_data
      const raw = (qp.data || qp.form_data) as string;
      try {
        JSON.parse(raw);
        next.dataJson = raw;
      } catch {
        // ignore invalid JSON
      }
    }
    if (Object.keys(next).length > 0) {
      setForm((f) => ({ ...f, ...next } as FormState));
    }
    const auto = params.get("auto");
    if (auto === "1" && (qp.instructions || qp.url || qp.data || qp.form_data)) {
      // Delay a tick to ensure state applied
      setTimeout(() => {
        void handleSubmit();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const hasOutput = slidesCount > 0;

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-4 overflow-y-auto flex flex-col min-h-0 flex-1 items-center justify-center w-full">
      <div className="w-full">
        <h1 className="text-7xl font-serif font-semibold text-transparent bg-clip-text bg-gradient-to-b from-stone-800 to-stone-800/40">
          Filora
        </h1>
        <h3 className="text-3xl font-serif font-semibold italic text-muted-foreground/80 mb-6">
          Action-taking browser agent
        </h3>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid md:grid-cols-2 gap-6 w-full">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={form.url}
              placeholder="https://..."
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              disabled={loading}
              rows={5}
              placeholder="Tell Filora what to do..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              min={1}
              max={300}
              value={form.timeout}
              onChange={(e) => setForm((f) => ({ ...f, timeout: Number(e.target.value || 0) }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Form Data (JSON)</Label>
            <Textarea
              id="data"
              value={form.dataJson}
              onChange={(e) => setForm((f) => ({ ...f, dataJson: e.target.value }))}
              disabled={loading}
              rows={10}
              className="font-mono"
            />
            <div className="text-xs text-muted-foreground">
              Accepts an object map or an array of {"{"}name, value{"}"} pairs.
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading} variant="fancy">
            {loading ? "Running..." : "Run Action"}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Output</div>
          <div
            className={cn(
              "relative w-full aspect-[4/3] rounded-2xl border bg-black/80 overflow-hidden",
              !hasOutput && "grid place-items-center"
            )}
          >
            {!hasOutput && <div className="text-muted-foreground">No screenshots returned</div>}
            {hasOutput && (
              <PointerLayer className="w-full h-full">
                {/* Show current screenshot */}
                {usableScreenshots[currentShot] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={usableScreenshots[currentShot]}
                    alt={`Step ${currentShot + 1}`}
                    className="absolute inset-0 size-full object-contain cursor-pointer"
                    onClick={() =>
                      setCurrentShot((s) => (slidesCount > 0 ? (s + 1) % slidesCount : 0))
                    }
                  />
                )}

                <Pointer x={x} y={y} thoughts={thoughts} />
              </PointerLayer>
            )}
          </div>

          {slidesCount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Slide {Math.min(currentShot + 1, Math.max(1, slidesCount))} /{" "}
                {Math.max(1, slidesCount)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setCurrentShot((s) =>
                      slidesCount > 0 ? (s - 1 + slidesCount) % slidesCount : 0
                    )
                  }
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setCurrentShot((s) => (slidesCount > 0 ? (s + 1) % slidesCount : 0))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {slidesCount > 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {Array.from({ length: slidesCount }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-2 w-2 rounded-full",
                    i === currentShot ? "bg-primary" : "bg-foreground/30 hover:bg-foreground/50"
                  )}
                  onClick={() => setCurrentShot(i)}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {response && (
            <div className="rounded-xl border p-3 text-xs bg-card">
              <div>
                <span className="text-muted-foreground">Status:</span> {response.status}
              </div>
              {response.message && (
                <div className="truncate">
                  <span className="text-muted-foreground">Message:</span> {response.message}
                </div>
              )}
              {response.error && (
                <div className="text-red-600">
                  <span className="text-muted-foreground">Error:</span> {response.error}
                </div>
              )}
              <div className="text-muted-foreground">Task ID: {response.task_id}</div>
              <div className="text-muted-foreground">
                Execution time: {response.execution_time}s
              </div>
              {screenshotsRaw && screenshotsRaw.length > 0 && (
                <div className="mt-2 text-muted-foreground">
                  Raw screenshot heads:
                  <ul className="list-disc pl-5 space-y-0.5">
                    {screenshotsRaw.slice(0, 5).map((s, i) => (
                      <li key={i} className="break-all">
                        {String(s).slice(0, 30)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-muted-foreground">Debug</summary>
                <div className="mt-2 grid gap-2">
                  <div>
                    <div className="text-muted-foreground">Last request body</div>
                    <pre className="whitespace-pre-wrap break-all bg-muted rounded-md p-2 overflow-auto max-h-48">
                      {JSON.stringify(lastRequestBody, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Raw response</div>
                    <pre className="whitespace-pre-wrap break-all bg-muted rounded-md p-2 overflow-auto max-h-48">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
