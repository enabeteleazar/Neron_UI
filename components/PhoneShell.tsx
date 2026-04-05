"use client";

import { useState } from "react";
import StatusBar from "./StatusBar";
import FlightCard from "./FlightCard";
import AssistantBar from "./AssistantBar";
import NavBar from "./NavBar";

export default function PhoneShell() {
  const [showFlight, setShowFlight] = useState(true);

  return (
    /* Fond d'écran centré */
    <div className="flex min-h-screen items-center justify-center bg-[#06060e] p-4">

      {/* Lueur ambiante derrière le téléphone */}
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
        {/* Ligne de lumière en haut */}
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

        {/* Corps scrollable */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">

          {/* Section vol */}
          {showFlight && (
            <section id="flight-section" aria-label="Informations de vol">
              <FlightCard />
            </section>
          )}

          {/* Placeholder carte */}
          <MapPlaceholder />
        </div>

        {/* Footer assistant */}
        <AssistantBar prompt="Comment puis-je vous aider ?" />

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

function MapPlaceholder() {
  return (
    <div className="flex h-[140px] items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex flex-col items-center gap-2 text-white/20">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"
            fill="currentColor"
          />
        </svg>
        <span className="text-[10px] uppercase tracking-widest">Carte</span>
      </div>
    </div>
  );
}
