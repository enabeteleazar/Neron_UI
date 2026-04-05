"use client";

import { useCallback, useRef, useState } from "react";
import type { ConnectionStatus } from "@/lib/types";

interface AssistantBarProps {
  onSend: (text: string) => void;
  isStreaming: boolean;
  status: ConnectionStatus;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting:   "Connexion…",
  connected:    "Néron",
  disconnected: "Déconnecté",
  error:        "Erreur",
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connecting:   "bg-amber-400 neron-pulse",
  connected:    "bg-cyan-400",
  disconnected: "bg-white/20",
  error:        "bg-red-400",
};

export default function AssistantBar({
  onSend,
  isStreaming,
  status,
}: AssistantBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text || isStreaming || status !== "connected") return;
    onSend(text);
    setValue("");
    inputRef.current?.focus();
  }, [value, isStreaming, status, onSend]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend =
    value.trim().length > 0 && !isStreaming && status === "connected";

  return (
    <div className="flex flex-col gap-2 border-t border-white/[0.06] px-4 py-3">
      {/* Indicateur statut */}
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          {STATUS_LABEL[status]}
        </span>
        {isStreaming && (
          <span className="ml-auto text-[10px] uppercase tracking-wider text-cyan-400/50">
            écriture…
          </span>
        )}
      </div>

      {/* Input */}
      <div
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition-colors duration-200 ${
          status === "connected"
            ? "border-white/[0.08] bg-white/[0.03] focus-within:border-cyan-400/20 focus-within:bg-white/[0.05]"
            : "border-white/[0.04] bg-white/[0.02] opacity-50"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            status === "connected" ? "Votre message…" : STATUS_LABEL[status]
          }
          disabled={status !== "connected" || isStreaming}
          className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none disabled:cursor-not-allowed"
          aria-label="Message à envoyer à Néron"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Envoyer"
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
            canSend
              ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
              : "cursor-not-allowed text-white/15"
          }`}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
