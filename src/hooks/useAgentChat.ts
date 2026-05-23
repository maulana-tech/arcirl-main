import { useState, useCallback } from "react";
import { fnFetch, SUPABASE_URL } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isStub?: boolean;
  ts: number;
}

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      setError(null);
      const userMsg: ChatMessage = { role: "user", content, ts: Date.now() };
      const history = [...messages, userMsg];
      setMessages(history);
      setPending(true);
      try {
        const res = await fnFetch(`${SUPABASE_URL}/functions/v1/agent-chat`, {
          method: "POST",
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const reply: ChatMessage = {
          role: "assistant",
          content: data.reply ?? "(empty)",
          isStub: Boolean(data.isStub),
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, reply]);
      } catch (err: any) {
        setError(err?.message ?? "Failed to reach agent-chat");
      } finally {
        setPending(false);
      }
    },
    [messages],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, send, pending, error, reset };
}
