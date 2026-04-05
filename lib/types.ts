// Types partagés pour le client Néron

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming: boolean;
  timestamp: Date;
  error?: boolean;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// Correspond à CoreResponse du serveur (POST /input/text)
export interface CoreResponse {
  response: string;
  intent: string;
  agent: string;
  confidence: string;
  timestamp: string;
  execution_time_ms: number;
  model?: string;
  error?: string;
  metadata: Record<string, unknown>;
}
