"use client";

import { useEffect, useState } from "react";

interface TimeState {
  hours: string;
  minutes: string;
  seconds: string;
  formatted: string;
}

function formatTime(date: Date): TimeState {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return {
    hours,
    minutes,
    seconds,
    formatted: `${hours}:${minutes}`,
  };
}

export function useTime(): TimeState | null {
  const [time, setTime] = useState<TimeState | null>(null);

  useEffect(() => {
    setTime(formatTime(new Date()));

    const id = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return time;
}
