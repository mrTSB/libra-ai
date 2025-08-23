import { ArrowUp } from "lucide-react";
import ContextPill from "@/components/agent/context-pill";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const modelOptions = [
    {
        label: "GPT-4o",
        value: "gpt-4o",
    },
    {
        label: "GPT-4o-mini",
        value: "gpt-4o-mini",
    },
    {
        label: "Claude 3.5 Sonnet",
        value: "claude-3.5-sonnet",
    },
]

export default function ChatInput({ className, input, handleInputChange, handleSubmit }: { className?: string, input: string, handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void, handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
    return (
        <form className={cn("flex flex-col rounded-xl border bg-card shadow-sm shadow-stone-400/10 transition-all", className)} onSubmit={handleSubmit}>
            <div className="flex flex-row gap-1 p-2 pb-0">
            <ContextPill />
            <ContextPill />
            </div>
            <Input className="p-3 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none border-none shadow-none" placeholder="Type your message here..." value={input} onChange={handleInputChange}/>
            <div className="flex flex-row p-2 pt-0 items-end justify-between">
                <Select>
                    <SelectTrigger size="sm" className="w-fit border-none focus-visible:ring-0 shadow-none">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        {modelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button size="iconSm" type="submit" className="ml-auto shadow-none">
                    <ArrowUp className="h-4 w-4" />
                </Button>
            </div>
      </form>
    )
}