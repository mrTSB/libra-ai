"use client";
// import Paper from "@/components/paper/paper";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
// import Process from "@/components/process/process";
import Agent from "@/components/agent/agent";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ChevronRight } from "lucide-react";

export interface ResearchSearch {
  query: string;
  citations: string[];
  results: string[];
}

export default function JunoPage() {
  const [paper, setPaper] = useState<string>("");
  return (
    <div className="h-full w-full p-4 pt-2 flex-1 min-h-0 flex flex-col">
      <ResizablePanelGroup
        direction="horizontal"
        style={{ overflow: "visible" }}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={30} style={{ overflow: "visible" }}>
          <div className="flex flex-col h-full w-full items-start justify-start gap-4 overflow-visible">
            <div className="text-4xl font-serif tracking-tight">Document</div>
            {/* <Paper className="min-h-0 w-full flex-1" paper={paper} setPaper={setPaper} /> */}
          </div>
        </ResizablePanel>
        <ResizableHandle className="bg-transparent p-2 w-4" />
        <ResizablePanel defaultSize={20}>
          <div className="flex flex-col h-full w-full items-start justify-start gap-4">
            <div className="text-4xl font-serif tracking-tight">Juno Agent</div>
            <Agent className="h-full w-full" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
