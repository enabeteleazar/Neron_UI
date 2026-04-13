interface FlightInfo {
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departure: string;
  arrival: string;
  terminal: string;
  gate: string;
  status?: "on-time" | "delayed" | "boarding";
}

interface FlightCardProps {
  flight?: FlightInfo;
}

const DEFAULT_FLIGHT: FlightInfo = {
  origin: "San Francisco",
  originCode: "SFO",
  destination: "New York",
  destinationCode: "JFK",
  departure: "21:25",
  arrival: "04:30",
  terminal: "A",
  gate: "A15",
  status: "on-time",
};

const STATUS_LABELS: Record<NonNullable<FlightInfo["status"]>, string> = {
  "on-time": "À l'heure",
  delayed: "Retardé",
  boarding: "Embarquement",
};

const STATUS_COLORS: Record<NonNullable<FlightInfo["status"]>, string> = {
  "on-time": "text-emerald-400 bg-emerald-400/10",
  delayed: "text-amber-400 bg-amber-400/10",
  boarding: "text-cyan-400 bg-cyan-400/10",
};

export default function FlightCard({ flight = DEFAULT_FLIGHT }: FlightCardProps) {
  const statusColor = flight.status
    ? STATUS_COLORS[flight.status]
    : STATUS_COLORS["on-time"];
  const statusLabel = flight.status
    ? STATUS_LABELS[flight.status]
    : STATUS_LABELS["on-time"];

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-md fade-in">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlaneIcon />
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/40">
            Vol
          </span>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Trajet */}
      <div className="flex items-center justify-between">
        {/* Départ */}
        <div className="flex flex-col">
          <span className="font-mono text-2xl font-semibold text-white">
            {flight.departure}
          </span>
          <span className="mt-0.5 text-xs font-medium text-white/70">
            {flight.originCode}
          </span>
          <span className="text-[10px] text-white/35">{flight.origin}</span>
        </div>

        {/* Ligne de vol */}
        <div className="mx-3 flex flex-1 flex-col items-center gap-1">
          <div className="relative flex w-full items-center">
            <div className="h-px flex-1 bg-white/10" />
            <div className="mx-2 text-white/25">
              <MiniPlaneIcon />
            </div>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <span className="text-[9px] uppercase tracking-widest text-white/25">
            Direct
          </span>
        </div>

        {/* Arrivée */}
        <div className="flex flex-col items-end">
          <span className="font-mono text-2xl font-semibold text-white">
            {flight.arrival}
          </span>
          <span className="mt-0.5 text-xs font-medium text-white/70">
            {flight.destinationCode}
          </span>
          <span className="text-[10px] text-white/35">{flight.destination}</span>
        </div>
      </div>

      {/* Infos gate */}
      <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-3">
        <InfoPill label="Terminal" value={flight.terminal} />
        <div className="h-3 w-px bg-white/10" />
        <InfoPill label="Porte" value={flight.gate} />
      </div>
    </article>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-white/30">
        {label}
      </span>
      <span className="text-sm font-semibold text-white/75">{value}</span>
    </div>
  );
}

function PlaneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.21v-1.895l-9-5.791V3.5a1.5 1.5 0 00-3 0v5.014l-9 5.791v1.895l9-2.7V19l-2.25 1.5v1.5L12 21l2.25 1.5V21L12 19v-5.49l10 2.7z"
        fill="rgba(34,211,238,0.7)"
      />
    </svg>
  );
}

function MiniPlaneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.21v-1.895l-9-5.791V3.5a1.5 1.5 0 00-3 0v5.014l-9 5.791v1.895l9-2.7V19l-2.25 1.5v1.5L12 21l2.25 1.5V21L12 19v-5.49l10 2.7z"
        fill="currentColor"
      />
    </svg>
  );
}
