"use client";

import { useState } from "react";
import { useNeron } from "@/hooks/useNeron";
import StatusBar from "./StatusBar";
import FlightCard from "./FlightCard";
import ChatView from "./ChatView";
import AssistantBar from "./AssistantBar";
import NavBar from "./NavBar";

export default function PhoneShell() {
  const [showFlight, setShowFlight] = useState(false);
  const { messages, status, isStreaming, send, clear } = useNeron();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06060e] p-4">
      {/* Lueur ambiante */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[600px] w-[300px] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(ellipse at center, #22d3ee 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Conteneur téléphone */}
      <main
        className="relative z-10 flex w-full max-w-[375px] flex-col overflow-hidden rounded-[38px] border border-white/[0.08] neron-glow"
        style={{
          height: "min(812px, 100dvh - 2rem)",
          background:
            "linear-gradient(160deg, #0d0d1c 0%, #08080f 50%, #060610 100%)",
        }}
      >
        {/* Ligne de lumière */}
        <div
          aria-hidden="true"
          className="absolute inset-x-16 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)",
          }}
        />

        {/* Status bar */}
        <StatusBar weather="26°C" city="Paris" />

        {/* Section vol (collapsible) */}
        <div className="px-4">
          <button
            onClick={() => setShowFlight((v) => !v)}
            className="flex items-center gap-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/25 transition-colors hover:text-cyan-400/50"
            aria-expanded={showFlight}
            aria-controls="flight-section"
          >
            <ChevronIcon expanded={showFlight} />
            {showFlight ? "Masquer le vol" : "Vol SFO → JFK"}
          </button>

          {showFlight && (
            <section id="flight-section" className="pb-2">
              <FlightCard />
            </section>
          )}
        </div>

        {/* Chat — prend tout l'espace restant */}
        <ChatView messages={messages} isStreaming={isStreaming} />

        {/* Bouton clear (visible si messages) */}
        {messages.length > 0 && (
          <div className="flex justify-center px-4 pb-1">
            <button
              onClick={clear}
              className="text-[10px] uppercase tracking-widest text-white/20 transition-colors hover:text-white/40"
              aria-label="Effacer la conversation"
            >
              Effacer
            </button>
          </div>
        )}

        {/* Input connecté */}
        <AssistantBar
          onSend={send}
          isStreaming={isStreaming}
          status={status}
        />

        {/* Navigation */}
        <NavBar />
      </main>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      style={{
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <path
        d="M3 2l4 3-4 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
