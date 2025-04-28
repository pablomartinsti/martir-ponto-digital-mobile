// utils/dateUtils.ts
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

// Formata um horário para "HH:mm", ou "--:--" se for nulo
export const formatTime = (dateString: string | null) => {
  return dateString
    ? dayjs(dateString).tz("America/Sao_Paulo").format("HH:mm")
    : "--:--";
};

// Retorna os dias da semana (usado para exibir "Seg - 22/04/2025")
export const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Formata uma data como "YYYY-MM-DD" no fuso horário de São Paulo
export const formatDate = (date: Date | string) => {
  return dayjs(date).tz("America/Sao_Paulo").format("YYYY-MM-DD");
};
