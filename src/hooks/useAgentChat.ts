import { useState, useCallback } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isStub?: boolean;
  ts: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

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
        const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
