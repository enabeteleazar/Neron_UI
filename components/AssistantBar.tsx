interface AssistantBarProps {
  prompt?: string;
  isActive?: boolean;
}

export default function AssistantBar({
  prompt = "Comment puis-je vous aider ?",
  isActive = false,
}: AssistantBarProps) {
  return (
    <div className="flex flex-col items-center gap-2 border-t border-white/[0.06] px-5 py-4">
      {/* Indicateur de statut Néron */}
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isActive ? "bg-cyan-400 neron-pulse" : "bg-white/20"
          }`}
        />
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">
          Néron
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isActive ? "bg-cyan-400 neron-pulse" : "bg-white/20"
          }`}
        />
      </div>

      {/* Prompt */}
      <p className="text-center text-sm font-light text-white/50">{prompt}</p>

      {/* Barre d'input simulée */}
      <div className="mt-1 flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
        <span className="flex-1 text-sm text-white/20">Votre message…</span>
        <MicIcon />
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" fill="rgba(34,211,238,0.5)" />
      <path
        d="M5 10a7 7 0 0014 0"
        stroke="rgba(34,211,238,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="12"
        y1="20"
        x2="12"
        y2="23"
        stroke="rgba(34,211,238,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
