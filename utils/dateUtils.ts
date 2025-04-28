// utils/dateUtils.ts
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Formata um horário para "HH:mm", ou "--:--" se for nulo
export const formatTime = (dateString: string | null) => {
  if (!dateString) return "--:--";
  const timeZone = "America/Sao_Paulo";
  const zonedDate = toZonedTime(new Date(dateString), timeZone);
  return format(zonedDate, "HH:mm");
};

// Retorna os dias da semana (usado para exibir "Seg - 22/04/2025")
export const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Formata uma data como "YYYY-MM-DD" no fuso horário de São Paulo
export const formatDate = (date: Date | string) => {
  const timeZone = "America/Sao_Paulo";
  const zonedDate = toZonedTime(new Date(date), timeZone);
  return format(zonedDate, "yyyy-MM-dd");
};
