"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNeron } from "@/hooks/useNeron";
import StatusBar from "./StatusBar";
import FlightCard from "./FlightCard";
import ChatView from "./ChatView";
import AssistantBar from "./AssistantBar";
import NavBar from "./NavBar";

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export default function PhoneShell() {
  const [showFlight, setShowFlight] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastSpokenRef = useRef<string>("");
  const { messages, status, isStreaming, send, clear } = useNeron();

  const recognitionSupported = useMemo(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    []
  );

  useEffect(() => {
    if (!recognitionSupported) return;
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const rec = new SpeechRecognitionCtor();
    rec.lang = "fr-FR";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
      }
      if (finalText.trim()) send(finalText.trim());
    };

    rec.onend = () => {
      if (isListening) rec.start();
    };

    recognitionRef.current = rec;
    return () => {
      rec.stop();
      recognitionRef.current = null;
    };
  }, [recognitionSupported, send, isListening]);

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && !m.streaming && !m.error);
    if (!lastAssistant || !window.speechSynthesis) return;
    if (lastAssistant.id === lastSpokenRef.current) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(lastAssistant.content);
    utter.lang = "fr-FR";
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
    lastSpokenRef.current = lastAssistant.id;
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    recognitionRef.current.start();
    setIsListening(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06060e] p-3 sm:p-4">
      <main className="relative z-10 flex h-[min(920px,100dvh-1.5rem)] w-full max-w-[1200px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-[#0d0d1c] via-[#08080f] to-[#060610]">
        <aside className="hidden w-[320px] border-r border-white/[0.06] p-5 lg:flex lg:flex-col lg:gap-4">
          <h1 className="text-lg font-semibold text-cyan-300">NeronOS Control Center</h1>
          <p className="text-sm text-white/50">Interface responsive + conversation vocale en direct activée.</p>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
            {recognitionSupported
              ? "Micro disponible: cliquez sur le bouton micro pour démarrer la conversation live."
              : "Reconnaissance vocale non supportée sur ce navigateur."}
          </div>
          <FlightCard />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <StatusBar weather="26°C" city="Paris" />
          <div className="px-4">
            <button
              onClick={() => setShowFlight((v) => !v)}
              className="flex items-center gap-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/25 transition-colors hover:text-cyan-400/50 lg:hidden"
            >
              {showFlight ? "Masquer le vol" : "Vol SFO → JFK"}
            </button>
            {showFlight && (
              <section id="flight-section" className="pb-2 lg:hidden">
                <FlightCard />
              </section>
            )}
          </div>

          <ChatView messages={messages} isStreaming={isStreaming} />
          {messages.length > 0 && (
            <div className="flex justify-center px-4 pb-1">
              <button
                onClick={clear}
                className="text-[10px] uppercase tracking-widest text-white/20 transition-colors hover:text-white/40"
              >
                Effacer
              </button>
            </div>
          )}
          <AssistantBar
            onSend={send}
            isStreaming={isStreaming}
            status={status}
            isListening={isListening}
            onToggleListening={toggleListening}
          />
          <NavBar />
        </section>
      </main>
    </div>
  );
}
