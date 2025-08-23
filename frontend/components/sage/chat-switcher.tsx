"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchSageChats, type SageChatsList } from "@/lib/sage";

type Props = {
  value: string | "new";
  onChange: (chatId: string | "new") => void;
};

export function SageChatSwitcher({ value, onChange }: Props) {
  const [data, setData] = useState<SageChatsList | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetchSageChats(50);
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const chats = data?.chats ?? [];

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => onChange(v as any)}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={loading ? "Loading chats…" : "Select chat"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">+ New chat</SelectItem>
          {chats.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.title || c.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
