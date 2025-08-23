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
    <div className="h-full w-full p-6 pt-2 flex-1 min-h-0 bg-blue-500">
      <ResizablePanelGroup direction="horizontal" style={{ overflow: "visible" }}>
        {/* <ResizablePanel defaultSize={13}>
          <div className="flex flex-col h-full w-full items-start justify-start gap-4">
            <div className="text-3xl font-light font-serif tracking-tight pl-2">Process</div>
            <Process className="h-full w-full px-4 pr-8" currentStep={paper.stageIndex} />
          </div>
        </ResizablePanel> */}
        <ResizableHandle className="bg-transparent w-4" />
        <ResizablePanel defaultSize={30} style={{ overflow: "visible" }}>
          <div className="flex flex-col h-full w-full items-start justify-start gap-4 overflow-visible">
            <div className="text-3xl font-light font-serif tracking-tight">Document</div>
            {/* <Paper className="min-h-0 w-full flex-1" paper={paper} setPaper={setPaper} /> */}
          </div>
        </ResizablePanel>
        <ResizableHandle className="bg-transparent w-4" />
        <ResizablePanel defaultSize={20}>
          <div className="flex flex-col h-full w-full items-start justify-start gap-4">
            <div className="text-3xl font-light font-serif tracking-tight">Juno Agent</div>
            <Agent className="h-full w-full" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
