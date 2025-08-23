"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onSend: (prompt: string) => void;
  disabled?: boolean;
};

export function SageComposer({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  function submit() {
    const v = value.trim();
    if (!v || disabled) return;
    onSend(v);
    setValue("");
  }

  return (
    <div className="w-full p-2">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message Sage"
          disabled={disabled}
          className="px-6 text-lg pr-28 py-8 rounded-3xl"
        />
        <Button
          onClick={submit}
          disabled={disabled || value.trim().length === 0}
          variant="fancy"
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
