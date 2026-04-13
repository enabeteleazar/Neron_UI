"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ConnectionStatus } from "@/lib/types";

// Résolution de l'URL WebSocket :
// 1. NEXT_PUBLIC_NERON_WS_URL si définie explicitement
// 2. Sinon construit depuis HOST + PORT
const _host = process.env.NEXT_PUBLIC_NERON_HOST ?? "localhost";
const _port = process.env.NEXT_PUBLIC_NERON_PORT ?? "18789";
const WS_URL =
  process.env.NEXT_PUBLIC_NERON_WS_URL ?? `ws://${_host}:${_port}`;
const TOKEN =
  process.env.NEXT_PUBLIC_NERON_TOKEN ?? "changez_moi";
const RECONNECT_DELAY_MS = 3000;

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export interface UseNeronReturn {
  messages: ChatMessage[];
  status: ConnectionStatus;
  isStreaming: boolean;
  send: (text: string) => void;
  clear: () => void;
}

export function useNeron(): UseNeronReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isStreaming, setIsStreaming] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const rpcIdRef = useRef(0);
  const sessionIdRef = useRef(`ui-${makeId()}`);
  // Map id → resolve pour les appels JSON-RPC attendus
  const pendingRef = useRef<Map<number, (v: unknown) => void>>(new Map());
  // Évite les reconnexions en boucle au démontage
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    // Helper interne : envoie un appel JSON-RPC et attend la réponse
    function rpc(
      method: string,
      params: Record<string, unknown>
    ): Promise<unknown> {
      return new Promise((resolve) => {
        const id = ++rpcIdRef.current;
        pendingRef.current.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    ws.onopen = async () => {
      setStatus("connected");

      try {
        // 1. Authentification (requise même avec le token par défaut)
        await rpc("gateway.auth", { token: TOKEN });

        // 2. Création de session
        await rpc("session.new", {
          session_id: sessionIdRef.current,
          system:
            "Tu es Néron, un assistant IA local. Tu réponds en français.",
        });
      } catch (err) {
        console.error("[Néron] erreur init session :", err);
      }
    };

    ws.onmessage = (event) => {
      let frame: Record<string, unknown>;
      try {
        frame = JSON.parse(event.data as string);
      } catch {
        return;
      }

      // ── Réponse JSON-RPC (id présent) ──
      if (frame.id != null) {
        const id = frame.id as number;
        const resolve = pendingRef.current.get(id);
        if (resolve) {
          pendingRef.current.delete(id);
          resolve((frame.result ?? frame.error) || null);
        }
        return;
      }

      // ── Event gateway ──
      const eventName = frame.event as string | undefined;
      const data = (frame.data ?? {}) as Record<string, unknown>;

      if (eventName === "gateway.auth_required") {
        // Le serveur demande l'auth mais onopen l'a déjà envoyée, ignoré
        return;
      }

      if (eventName === "agent.token") {
        const token = (data.token as string) ?? "";
        setIsStreaming(true);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.streaming) {
            // Ajouter le token au message en cours
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + token },
            ];
          }
          // Nouveau message assistant
          return [
            ...prev,
            {
              id: makeId(),
              role: "assistant",
              content: token,
              streaming: true,
              timestamp: new Date(),
            },
          ];
        });
        return;
      }

      if (eventName === "agent.done") {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.streaming) {
            return [...prev.slice(0, -1), { ...last, streaming: false }];
          }
          return prev;
        });
        setIsStreaming(false);
        return;
      }

      if (eventName === "agent.error") {
        const msg = (data.message as string) ?? "Erreur inconnue";
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content: msg,
            streaming: false,
            timestamp: new Date(),
            error: true,
          },
        ]);
        setIsStreaming(false);
        return;
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      setIsStreaming(false);
      if (!unmountedRef.current) {
        setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      setStatus("error");
      ws.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      // Ajouter le message utilisateur localement
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "user",
          content: trimmed,
          streaming: false,
          timestamp: new Date(),
        },
      ]);

      // Envoyer au gateway (fire-and-forget, réponse via events)
      ws.send(
        JSON.stringify({
          id: ++rpcIdRef.current,
          method: "chat.send",
          params: {
            session_id: sessionIdRef.current,
            message: trimmed,
          },
        })
      );
    },
    [isStreaming]
  );

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, status, isStreaming, send, clear };
}
