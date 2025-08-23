import { cn } from "@/lib/utils";
import ContextPill from "@/components/agent/context-pill";
import { Undo2 } from "lucide-react";
import { Button } from "../ui/button";

export default function UserMessage({ className, message }: { className?: string, message: string }) {
    return (
    <div className={cn("flex w-full flex-col space-y-2 rounded-xl border bg-card p-2 shadow-sm shadow-stone-400/10 transition-all hover:-translate-y-px hover:shadow-md", className)}>
        <div className="flex flex-row gap-1">
          <ContextPill />
          <ContextPill />
        </div>
        <p className="px-1">{message}</p>
        <Button variant="secondary" size="xs" className="ml-auto shadow-none">
          <Undo2 className="h-3 w-3 -translate-y-px" />
          Restore checkpoint
        </Button>
    </div>
    )
}
