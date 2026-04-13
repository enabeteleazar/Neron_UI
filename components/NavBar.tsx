"use client";

import { useState } from "react";

type NavItem = "phone" | "messages" | "profile" | "assistant";

const NAV_ITEMS: Array<{ id: NavItem; label: string }> = [
  { id: "phone", label: "Téléphone" },
  { id: "messages", label: "Messages" },
  { id: "profile", label: "Profil" },
  { id: "assistant", label: "Assistant IA" },
];

export default function NavBar() {
  const [active, setActive] = useState<NavItem>("assistant");

  return (
    <nav
      aria-label="Menu principal"
      className="flex items-center justify-around border-t border-white/[0.06] px-2 py-3"
    >
      {NAV_ITEMS.map(({ id, label }) => (
        <button
          key={id}
          aria-label={label}
          aria-current={active === id ? "page" : undefined}
          onClick={() => setActive(id)}
          className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-200 ${
            active === id
              ? "text-cyan-400"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          <NavIcon id={id} isActive={active === id} />
          <span className="text-[9px] uppercase tracking-wider">{label.split(" ")[0]}</span>
        </button>
      ))}
    </nav>
  );
}

function NavIcon({ id, isActive }: { id: NavItem; isActive: boolean }) {
  const color = isActive ? "#22d3ee" : "rgba(226,232,240,0.3)";

  switch (id) {
    case "phone":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.37 11.37 0 003.56.57 1 1 0 011 1v3.49a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1 11.37 11.37 0 00.57 3.56 1 1 0 01-.25 1.03l-2.2 2.2z"
            fill={color}
          />
        </svg>
      );
    case "messages":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"
            fill={color}
          />
        </svg>
      );
    case "profile":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="4" fill={color} />
          <path
            d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "assistant":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill={color} />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
