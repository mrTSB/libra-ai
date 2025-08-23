import { cn } from "@/lib/utils";

export default function ContextPill({ className }: { className?: string }) {
    return (
        <div className={cn("flex cursor-default flex-row items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 pl-1 text-xs hover:bg-stone-50", className)}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Wikipedia%27s_W.svg/1200px-Wikipedia%27s_W.svg.png" className="h-4 w-4" />
            Wikipedia
          </div>
    )
}