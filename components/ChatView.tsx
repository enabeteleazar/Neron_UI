"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";

interface ChatViewProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export default function ChatView({ messages, isStreaming }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas à chaque nouveau token
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <NeuralIcon />
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/20">
          Néron en attente
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Indicateur typing pendant le streaming */}
      {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
        <TypingIndicator />
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} fade-in`}
    >
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? "rounded-tr-sm bg-cyan-500/20 text-white/90"
            : message.error
              ? "rounded-tl-sm border border-red-500/20 bg-red-500/10 text-red-400"
              : "rounded-tl-sm border border-white/[0.06] bg-white/[0.04] text-white/80"
        }`}
      >
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
          {message.streaming && (
            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-cyan-400/70 align-middle" />
          )}
        </p>
        <p
          className={`mt-1 text-[9px] uppercase tracking-wider ${
            isUser ? "text-right text-cyan-400/40" : "text-white/20"
          }`}
        >
          {message.timestamp.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {message.streaming && " · écriture…"}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 fade-in">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan-400/40"
          style={{
            animation: `neron-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function NeuralIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.5" fill="rgba(34,211,238,0.25)" />
      <circle cx="12" cy="12" r="5" stroke="rgba(34,211,238,0.1)" strokeWidth="1" />
      <circle cx="12" cy="12" r="8.5" stroke="rgba(34,211,238,0.05)" strokeWidth="1" />
      <path
        d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
        stroke="rgba(34,211,238,0.3)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
