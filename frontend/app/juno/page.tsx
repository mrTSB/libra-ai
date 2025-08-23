"use client";
// import Paper from "@/components/paper/paper";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
// import Process from "@/components/process/process";
import Agent from "@/components/agent/agent";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Paper from "@/components/paper/paper";
import { cn } from "@/lib/utils";

export interface ResearchSearch {
  query: string;
  citations: string[];
  results: string[];
}

export default function JunoPage() {
  const [paper, setPaper] = useState<string>("");
  const [toolDiff, setToolDiff] = useState<{ oldText: string; newText: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      setPaper(text);
      setToolDiff(null);
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Read as text for .txt/.md; browsers infer correct encoding for UTF-8
      await handleFile(file);
    } catch (err) {
      console.error("Failed to read file:", err);
    } finally {
      // reset input value so same file can be re-selected later
      e.target.value = "";
    }
  }
  function containsFiles(e: React.DragEvent) {
    return Array.from(e.dataTransfer?.types || []).includes("Files");
  }
  function handleDragOver(e: React.DragEvent) {
    if (!containsFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragging) setIsDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    if (!containsFiles(e)) return;
    e.preventDefault();
    setIsDragging(false);
  }
  async function handleDrop(e: React.DragEvent) {
    if (!containsFiles(e)) return;
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
    setIsDragging(false);
  }
  return (
    <div className="h-full w-full p-2 pt-2 flex-1 min-h-0 flex flex-col">
      <ResizablePanelGroup
        direction="horizontal"
        style={{ overflow: "visible" }}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={30} style={{ overflow: "visible" }}>
          <div
            className={`flex flex-col h-full w-full items-start justify-start gap-4 overflow-visible max-w-2xl mx-auto relative`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="text-4xl font-serif font-bold text-stone-700 tracking-tight">
                Juno
              </div>
              {/* <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Upload document
                </Button>
              </div> */}
            </div>
            {paper.trim().length === 0 ? (
              <div className="min-h-0 w-full flex-1 flex items-center justify-center">
                <div
                  className={cn(
                    "w-full max-w-xl rounded-2xl border border-dashed p-10 text-center grid gap-3 transition-all duration-500 ease-out",
                    isDragging ? "ring-8 ring-primary/20 rounded-md border-primary" : ""
                  )}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="relative w-full h-full -mb-10">
                    <div className="mx-auto group relative flex h-60 w-3xs scale-[70%] flex-col items-center justify-center perspective-near">
                      <div
                        className={cn(
                          "absolute z-10 flex h-32 w-48 origin-bottom translate-y-10 flex-col items-center justify-center rounded-t-md rounded-b-3xl border bg-background border-primary/30 bg-radial-[at_50%_25%] to-primary/40 from-primary/10 shadow-sm inset-shadow-sm inset-shadow-white/50 transition-all duration-300 ease-out",
                          isDragging
                            ? "-rotate-x-12 shadow-[0_-10px_15px_1px_rgba(168,162,158,0.1)]"
                            : ""
                        )}
                      ></div>

                      <div
                        className={cn(
                          "absolute h-28 w-24 -translate-x-12 translate-y-2 -rotate-8 rounded-lg border border-gray-200 bg-white shadow-md inset-shadow-sm inset-shadow-gray-50 transition-all duration-300 ease-out",
                          isDragging ? "-translate-x-14 -translate-y-1 scale-110 -rotate-16" : ""
                        )}
                      >
                        <div className="mx-3 mt-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-400"></span>
                            <div className="h-1.5 w-14 rounded bg-gray-200"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-400"></span>
                            <div className="h-1.5 w-16 rounded bg-gray-200"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-400"></span>
                            <div className="h-1.5 w-12 rounded bg-gray-200"></div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "absolute h-28 w-24 translate-x-12 translate-y-3 rotate-8 rounded-lg border border-gray-200 bg-white shadow-md inset-shadow-sm inset-shadow-gray-50 transition-all duration-300 ease-out",
                          isDragging ? "translate-x-14 -translate-y-0.5 scale-110 rotate-14" : ""
                        )}
                      >
                        <div className="mx-3 mt-2 flex items-end gap-1.5">
                          <div className="h-3 w-2 rounded bg-stone-300"></div>
                          <div className="h-5 w-2 rounded bg-stone-400"></div>
                          <div className="h-10 w-2 rounded bg-stone-500"></div>
                          <div className="h-7 w-2 rounded bg-stone-300"></div>
                          <div className="h-9 w-2 rounded bg-stone-600"></div>
                        </div>
                        <div className="mx-3 mt-1 h-1 w-16 rounded bg-gray-200"></div>
                      </div>

                      <div
                        className={cn(
                          "absolute h-30 w-28 rounded-lg border border-gray-200 bg-white shadow-md inset-shadow-sm inset-shadow-gray-50 transition-all duration-300 ease-out",
                          isDragging ? "-translate-y-6 scale-120 shadow-lg" : ""
                        )}
                      >
                        <div className="mx-3 mt-3 h-2 w-16 rounded bg-gray-300"></div>
                        <div className="mx-3 mt-2 space-y-1.5">
                          <div className="h-1.5 w-20 rounded bg-gray-200"></div>
                          <div className="h-1.5 w-18 rounded bg-gray-200"></div>
                          <div className="h-1.5 w-14 rounded bg-gray-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-4xl font-serif tracking-tight">No document yet</div>
                  <div className="text-sm text-muted-foreground">
                    Upload a .txt or .md file to get started, or drag and drop it here.
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-12">
                    <Button size="sm" variant="fancy" onClick={() => fileInputRef.current?.click()}>
                      Upload document
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Paper
                className="min-h-0 w-full flex-1 animate-in zoom-in-90 fade-in-0 slide-in-from-bottom-8 duration-500 ease-out"
                paper={paper}
                setPaper={setPaper}
                toolDiff={toolDiff}
              />
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle className="bg-transparent p-2 w-4" />
        <ResizablePanel defaultSize={20}>
          <div className="flex flex-col h-full w-full items-start justify-start gap-4">
            <div className="text-4xl font-serif tracking-tight">Agent</div>
            <Agent
              className="h-full w-full"
              paper={paper}
              setPaper={setPaper}
              onToolDiffPreview={setToolDiff}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
