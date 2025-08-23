"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Markdown from "@/components/ui/markdown";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type DonnaEvent = {
  event: string;
  data: any;
};

const sampleTitle = "Urgent: BetaCorp contract breach and injunction options";
const sampleMessage =
  "Hello Donna, we are Acme Robotics, a startup that recently entered into a distribution agreement with BetaCorp. We believe BetaCorp has breached several obligations, including exclusivity and timely payments, and they are threatening to terminate without cause. We need urgent guidance on remedies under New York law, potential injunctive relief to stop further harm, and how to preserve evidence. There may also be IP misuse of our confidential manufacturing drawings.";

export default function DonnaPage() {
  const [title, setTitle] = useState(sampleTitle);
  const [message, setMessage] = useState(sampleMessage);
  const [sendEmail, setSendEmail] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [events, setEvents] = useState<DonnaEvent[]>([]);
  const [editing, setEditing] = useState<boolean>(() => sampleMessage.trim().length === 0);

  const eventGroups = useMemo(() => {
    const byType: Record<string, any> = {};
    for (const e of events) {
      byType[e.event] = e.data;
    }
    return byType;
  }, [events]);

  const controllerRef = useRef<AbortController | null>(null);
  const notifiedStepsRef = useRef<Record<string, boolean>>({});

  function AnimatedSection({
    show,
    className,
    children,
  }: {
    show: boolean;
    className?: string;
    children: React.ReactNode;
  }) {
    if (!show) return null;
    return (
      <section
        className={`animate-in fade-in-50 slide-in-from-bottom-1 duration-300 ${className || ""}`}
      >
        {children}
      </section>
    );
  }

  async function startWorkflow() {
    if (streaming) return;
    setEvents([]);
    setStreaming(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("/api/donna/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, title, send_email: sendEmail }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        setEvents((prev) => [
          ...prev,
          { event: "error", data: { message: data?.error || "Request failed" } },
        ]);
        setStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          const lines = rawEvent.split("\n");
          let ev = "message";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              ev = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataStr += line.slice(5).trim();
            }
          }
          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              setEvents((prev) => [...prev, { event: ev, data: parsed }]);
              // Toast step completions once
              const stepKey = ev;
              if (
                [
                  "title",
                  "questions",
                  "expert_selected",
                  "email_draft",
                  "expert_reply",
                  "memo",
                  "done",
                ].includes(stepKey) &&
                !notifiedStepsRef.current[stepKey]
              ) {
                notifiedStepsRef.current[stepKey] = true;
                const labels: Record<string, string> = {
                  title: "Generated case title",
                  questions: "Drafted expert questions",
                  expert_selected: "Selected the best expert",
                  email_draft: "Drafted email to expert",
                  expert_reply: "Received expert reply",
                  memo: "Prepared internal memo",
                  done: "Workflow complete",
                };
                toast.success(labels[stepKey] || stepKey);
              }
            } catch {
              setEvents((prev) => [...prev, { event: ev, data: dataStr }]);
            }
          }
        }
      }
    } catch (err: any) {
      setEvents((prev) => [...prev, { event: "error", data: { message: String(err) } }]);
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  }

  function stopWorkflow() {
    controllerRef.current?.abort();
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-8 overflow-y-auto min-h-0 flex-1">
      <div className="space-y-2">
        <h1 className="text-5xl font-semibold font-serif">Donna</h1>
        <p className="text-muted-foreground text-lg">
          Triage, draft expert outreach, and prepare an internal memo for all inbound emails.
        </p>
      </div>

      <AnimatedSection show={streaming || events.length > 0} className="space-y-3">
        <h2 className="text-lg font-medium">Progress</h2>
        <div className="max-h-80 overflow-y-auto pr-1 rounded-2xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="">
              {(() => {
                const steps = [
                  { key: "title", label: "Generate case title", done: !!eventGroups.title },
                  {
                    key: "questions",
                    label: "Draft questions for expert",
                    done: !!eventGroups.questions,
                  },
                  {
                    key: "expert_selected",
                    label: "Select best expert",
                    done: !!eventGroups.expert_selected,
                  },
                  {
                    key: "email_draft",
                    label: "Draft email to expert",
                    done: !!eventGroups.email_draft,
                  },
                  {
                    key: "expert_reply",
                    label: "Receive expert reply",
                    done: !!eventGroups.expert_reply,
                  },
                  { key: "memo", label: "Draft internal memo", done: !!eventGroups.memo },
                  { key: "done", label: "Workflow complete", done: !!eventGroups.done },
                ];
                const firstPending = steps.findIndex((s) => !s.done);
                const currentIdx = firstPending === -1 ? steps.length - 1 : firstPending;
                return (
                  <ul className="space-y-2">
                    {steps.map((s, i) => {
                      const isDone = s.done;
                      const isCurrent = !s.done && i === currentIdx && streaming;
                      const symbol = isDone ? "✓" : isCurrent ? "●" : "○";
                      const color = isDone
                        ? "text-green-600"
                        : isCurrent
                        ? "text-primary"
                        : "text-muted-foreground";
                      return (
                        <li key={s.key} className={`flex items-center gap-2 ${color}`}>
                          <span className="w-5 text-center">{symbol}</span>
                          <span className="text-sm">{s.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
            <div className="space-y-3">
              {eventGroups.title && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                    Case
                  </div>
                  <div className="font-medium">{eventGroups.title?.title}</div>
                </div>
              )}
              {eventGroups.expert_selected && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                    Assigned to
                  </div>
                  <div className="font-medium">{eventGroups.expert_selected?.email}</div>
                  {!!eventGroups.expert_selected.reason && (
                    <div className="text-xs text-muted-foreground">
                      {eventGroups.expert_selected.reason}
                    </div>
                  )}
                </div>
              )}
              {eventGroups.error && (
                <div className="text-red-600 text-sm">
                  Error: {eventGroups.error.error || eventGroups.error.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {!streaming ? (
        editing || message.trim().length === 0 ? (
          <section className="space-y-3 rounded-2xl border border-border p-4">
            <h2 className="text-2xl font-medium mt-1">Client Email</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject</p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Email subject"
              className="border border-none bg-transparent hover:bg-foreground/5 text-lg py-2 px-2"
            />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Body</p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="Paste the client's email here"
              className="border border-none bg-transparent hover:bg-foreground/5"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Actually send email externally (if allowed by backend)
              </label>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTitle(sampleTitle);
                    setMessage(sampleMessage);
                  }}
                >
                  Use Sample
                </Button>
                <Button onClick={startWorkflow} variant="fancy">
                  Start
                </Button>
                {message.trim().length > 0 && (
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Collapse
                  </Button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-2 rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-medium">Client Email</h2>
              <div className="ml-auto flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button onClick={startWorkflow} variant="fancy">
                  Start
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Subject</div>
            <div className="font-medium">{title || "(no subject)"}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Body</div>
            <div className="max-h-40 overflow-y-auto text-sm">
              <Markdown size="sm" className="p-0">
                {message || "(no body)"}
              </Markdown>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  className="h-4 w-4"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(!!checked)}
                />
                Actually send email externally (if allowed)
              </label>
            </div>
          </section>
        )
      ) : (
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Streaming…</Badge>
          <div className="text-sm text-muted-foreground truncate">Subject: {title}</div>
          <div className="ml-auto">
            <Button variant="destructive" onClick={stopWorkflow}>
              Stop
            </Button>
          </div>
        </div>
      )}

      <AnimatedSection show={!!eventGroups.questions} className="space-y-4">
        <h2 className="text-lg font-medium">Questions</h2>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1 rounded-2xl border border-border p-3">
          <div>
            <div className="text-sm font-medium mb-2">Viability</div>
            <ul className="list-disc pl-5 space-y-1">
              {(eventGroups.questions?.viability_questions || []).map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium mb-2">Cross-field</div>
            <ul className="list-disc pl-5 space-y-1">
              {(eventGroups.questions?.cross_field_questions || []).map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection show={!!eventGroups.expert_selected} className="space-y-2">
        <h2 className="text-lg font-medium">Experts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {[
            {
              email: "expert1@agentmail.to",
              specialties: [
                "Civil Litigation",
                "Criminal Defense",
                "Employment Disputes",
                "Personal Injury",
              ],
            },
            {
              email: "expert2@agentmail.to",
              specialties: [
                "Corporate Law",
                "Mergers & Acquisitions",
                "Contracts",
                "Intellectual Property",
                "Real Estate",
              ],
            },
            {
              email: "expert3@agentmail.to",
              specialties: ["Family Law", "Estate Planning", "Probate", "Immigration", "Elder Law"],
            },
          ].map((ex) => {
            const selected = ex.email === eventGroups.expert_selected?.email;
            return (
              <div
                key={ex.email}
                className={`flex items-start gap-3 rounded-2xl border p-3 ${
                  selected ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div
                  className={`size-9 shrink-0 rounded-full flex items-center justify-center ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {ex.email.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{ex.email}</div>
                    {selected && (
                      <Badge className="shrink-0" variant="outline">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {ex.specialties.join(" • ")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AnimatedSection>

      <AnimatedSection show={!!eventGroups.email_draft} className="space-y-2">
        <h2 className="text-lg font-medium">Draft to Expert</h2>
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1 rounded-2xl border border-border p-3">
          {eventGroups.email_draft?.to ? (
            <div className="text-sm text-muted-foreground">To: {eventGroups.email_draft?.to}</div>
          ) : null}
          <div className="font-medium">{eventGroups.email_draft?.subject || "Draft subject"}</div>
          <Markdown size="sm" className="p-0">
            {eventGroups.email_draft?.text || ""}
          </Markdown>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AnimatedSection show={!!eventGroups.expert_reply} className="space-y-2">
          <h2 className="text-lg font-medium">Expert Reply (Simulated)</h2>
          <div className="max-h-80 overflow-y-auto pr-1 rounded-2xl border border-border p-3">
            <Markdown size="sm" className="p-0">
              {eventGroups.expert_reply?.text}
            </Markdown>
          </div>
        </AnimatedSection>
        <AnimatedSection show={!!eventGroups.memo} className="space-y-2">
          <h2 className="text-lg font-medium">Internal Memo</h2>
          <div className="max-h-80 overflow-y-auto pr-1 rounded-2xl border border-border p-3">
            <div className="font-medium mb-2">{eventGroups.memo?.title}</div>
            <Markdown size="sm" className="p-0">
              {eventGroups.memo?.body.replace("•", "\n-")}
            </Markdown>
          </div>
        </AnimatedSection>
      </div>
      {/* 
      <AnimatedSection show={events.length > 0} className="space-y-2">
        <h2 className="text-lg font-medium">Raw Events</h2>
        <div className="max-h-64 overflow-auto text-xs space-y-1">
          {events.map((e, i) => (
            <div key={i}>
              <span className="text-muted-foreground">[{e.event}]</span>{" "}
              {typeof e.data === "string" ? e.data : JSON.stringify(e.data)}
            </div>
          ))}
        </div>
      </AnimatedSection> */}
    </div>
  );
}
