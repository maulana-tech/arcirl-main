import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, RotateCcw, Loader2, User, Zap } from "lucide-react";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";

const QUICK_PROMPTS = [
  "What's the strongest signal right now?",
  "Why did the engine flag that market?",
  "Which whale is the most active today?",
  "Should I bet on the top signal?",
  "Summarize what's happened in the last hour.",
];

export default function AICommandCenter() {
  const { messages, send, pending, error, reset } = useAgentChat();
  const { signals } = useUnifiedSignals({ limit: 5 });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || pending) return;
    setInput("");
    await send(content);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> AI Command Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Conversational interface to the Smart Money Copy Agent — full context on signals, wallets, bets
          </p>
        </div>
        <button
          onClick={reset}
          disabled={messages.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* Live signal strip — shows the agent's current top opinions, gives the user something to ask about */}
      {signals.length > 0 && (
        <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] text-primary uppercase tracking-wider mb-1.5">
            <Zap className="h-3 w-3" /> Live signal context
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {signals.slice(0, 5).map((s) => (
              <button
                key={s.id}
                onClick={() => handleSend(`Tell me about your ${s.side} signal on "${s.market_label ?? s.market_id}".`)}
                className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-[10px] text-left hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold ${s.side === "BUY" ? "text-emerald-500" : s.side === "SELL" ? "text-red-500" : "text-muted-foreground"}`}>{s.side}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground">{s.confidence}%</span>
                </div>
                <p className="text-foreground line-clamp-1 max-w-[180px]">{s.market_label ?? s.market_id}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && !pending && (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-foreground font-medium">Ask the agent anything</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md">
              It has live context on signals, tracked wallets, and your bet history. Try a quick prompt below or type your own.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-2xl">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[11px] text-foreground hover:bg-secondary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center ${
                m.role === "user" ? "bg-primary/15" : "bg-emerald-500/15"
              }`}>
                {m.role === "user" ? <User className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-secondary/60 text-foreground rounded-tl-sm"
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                {m.isStub && (
                  <span className="inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                    STUB · set ANTHROPIC_API_KEY for live reasoning
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {pending && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="rounded-2xl bg-secondary/60 px-3.5 py-2 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Reasoning...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">{error}</div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask the agent... (Enter to send)"
          className="flex-1 rounded-lg border border-border bg-secondary py-2.5 px-4 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          onClick={() => handleSend()}
          disabled={pending || !input.trim()}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" /> Send
        </button>
      </div>
    </div>
  );
}
