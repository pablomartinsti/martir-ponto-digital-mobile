import { useEffect, useRef, useState } from "react";

export function useClock() {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Atualiza data e hora em tempo real
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const optionsDate = {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      } as const;
      setCurrentDate(now.toLocaleDateString("pt-BR", optionsDate));
      setCurrentTime(now.toLocaleTimeString("pt-BR"));
    };

    updateDateTime();
    dateIntervalRef.current = setInterval(updateDateTime, 1000);
    return () => {
      if (dateIntervalRef.current) clearInterval(dateIntervalRef.current);
    };
  }, []);

  const startTimer = () => {
    if (intervalRef.current) return; // já está rodando
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setElapsedTime(0);
  };

  const setCustomElapsedTime = (seconds: number) => {
    setElapsedTime(seconds);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    currentDate,
    currentTime,
    elapsedTime,
    startTimer,
    pauseTimer,
    resetTimer,
    setCustomElapsedTime,
    formatTime,
  };
}
