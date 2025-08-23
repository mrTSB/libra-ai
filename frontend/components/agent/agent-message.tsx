import { Brain } from "lucide-react";
import Diff from "@/components/agent/diff";
import { cn } from "@/lib/utils";

function Thought({ duration }: { duration: number }) {
    return (
        <div className="flex flex-row items-center gap-1 text-sm text-muted-foreground/80 px-2">
            <Brain className="h-4 w-4" />
            <span><span className="font-semibold">Thought</span> for {duration}s</span>
        </div>
    )
}

function Message({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <p className={cn("flex flex-col gap-1 px-2", className)}>
            {children}
        </p>
    )
}

export default function AgentMessage({ className, message, thoughtDuration }: { className?: string, message: string, thoughtDuration: number }) {
    return (
        <div className={cn("space-y-2 my-2", className)}>
            <Thought duration={thoughtDuration} />
            <Message>{message}</Message>
            <Diff className="mt-2" oldText="However, a closer examination reveals that argumentative essays can be tools for intellectual exploration and even delaying definitive conclusions. This essay will argue that the very structure and demands of the argumentative essay inherently make it a superior placeholder for ideas that are still in development. Despite the common perception of an argumentative essay as a battle of wills, its purpose here is far more constructive: to create a robust foundation for future development." newText="However, a closer examination reveals that argumentative essays can be tools for intellectual exploration and even delaying definitive conclusions. This essay will argue that the need for reasoned claims, evidence, and counterarguments inherently make it a superior placeholder for ideas that are still in development. Despite the common perception of an argumentative essay as a battle of wills, its purpose here is far more constructive: to create a robust foundation for future development." lineRange={[24, 28]} />
      </div>
    )
}