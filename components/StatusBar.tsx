"use client";

import { useTime } from "@/hooks/useTime";

interface StatusBarProps {
  weather?: string;
  city?: string;
}

export default function StatusBar({
  weather = "26°C",
  city = "Paris",
}: StatusBarProps) {
  const time = useTime();

  return (
    <header className="flex items-start justify-between px-6 pt-5 pb-3">
      {/* Heure */}
      <div className="flex flex-col">
        <span className="font-mono text-[2.6rem] font-light leading-none tracking-tight text-white tabular-nums">
          {time?.formatted ?? "--:--"}
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
          {time
            ? new Date().toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })
            : "---"}
        </span>
      </div>

      {/* Météo */}
      <div className="flex flex-col items-end gap-0.5 pt-1">
        <div className="flex items-center gap-1.5">
          <CloudIcon />
          <span className="text-sm font-medium text-white/80">{weather}</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/30">
          {city}
        </span>
      </div>
    </header>
  );
}

function CloudIcon() {
  return (
    <svg
      width="16"
      height="12"
      viewBox="0 0 16 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 5.5a3 3 0 00-2.91-3A4 4 0 002 5.5v.07A2.5 2.5 0 002.5 11h10a2.5 2.5 0 00.5-4.95V5.5z"
        fill="rgba(226,232,240,0.45)"
      />
    </svg>
  );
}
