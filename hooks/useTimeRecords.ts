import { useEffect, useState, useCallback } from "react";
import {
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addMonths,
  subMonths,
  isAfter,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import api from "@/services/api";
import { formatDate } from "@/utils/dateUtils";

type Period = "day" | "week" | "month";

interface UseTimeRecordsResult {
  data: any;
  loading: boolean;
  errorMessage: string;
  goToNext: () => void;
  goToPrev: () => void;
  periodLabel: string;
  canGoNext: boolean;
}

export function useTimeRecords(period: Period): UseTimeRecordsResult {
  const timeZone = "America/Sao_Paulo";

  const today = startOfDay(toZonedTime(new Date(), timeZone));

  const [referenceDate, setReferenceDate] = useState(() => {
    if (period === "month") return startOfMonth(today);
    return today;
  });

  const [data, setData] = useState<any>(period === "day" ? null : []);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getRange = () => {
    if (period === "day") {
      return { startDate: referenceDate, endDate: referenceDate };
    }
    if (period === "week") {
      const dayOfWeek = referenceDate.getDay();
      const start = subDays(referenceDate, dayOfWeek);
      const end = addDays(start, 6);
      return { startDate: start, endDate: end };
    }
    // Caso "month"
    const start = startOfMonth(referenceDate);
    const end = endOfMonth(referenceDate);
    return { startDate: start, endDate: end };
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setData(period === "day" ? null : []);

    const { startDate, endDate } = getRange();

    if (isAfter(startDate, today)) {
      setErrorMessage("Não é possível visualizar registros futuros.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(
        `/time-records?period=${period}&startDate=${formatDate(
          startDate
        )}&endDate=${formatDate(endDate)}`
      );

      const responseData = response.data;

      if (!responseData.records || responseData.records.length === 0) {
        setErrorMessage("Nenhum registro encontrado.");
      } else {
        setData(responseData);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado.");
      } else {
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setLoading(false);
  }, [referenceDate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const goToNext = () => {
    let nextDate: Date;
    if (period === "day") {
      nextDate = addDays(referenceDate, 1);
    } else if (period === "week") {
      nextDate = addDays(referenceDate, 7);
    } else {
      nextDate = addMonths(referenceDate, 1);
    }

    if (isAfter(nextDate, today)) return;

    setReferenceDate(nextDate);
  };

  const goToPrev = () => {
    if (period === "day") {
      setReferenceDate(subDays(referenceDate, 1));
    } else if (period === "week") {
      setReferenceDate(subDays(referenceDate, 7));
    } else {
      setReferenceDate(subMonths(referenceDate, 1));
    }
  };

  const periodLabel = (() => {
    if (period === "day") {
      return format(referenceDate, "dd/MM/yyyy");
    }
    if (period === "week") {
      const dayOfWeek = referenceDate.getDay();
      const start = subDays(referenceDate, dayOfWeek);
      const end = addDays(start, 6);
      return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
    }
    return format(referenceDate, "MMMM 'de' yyyy", { locale: ptBR }).replace(
      /^./,
      (c) => c.toUpperCase()
    );
  })();

  const canGoNext = (() => {
    let nextDate: Date;
    if (period === "day") {
      nextDate = addDays(referenceDate, 1);
    } else if (period === "week") {
      nextDate = addDays(referenceDate, 7);
    } else {
      nextDate = addMonths(referenceDate, 1);
    }
    return !isAfter(nextDate, today);
  })();

  return {
    data,
    loading,
    errorMessage,
    goToNext,
    goToPrev,
    periodLabel,
    canGoNext,
  };
}

function getUnit(period: Period): "day" | "week" | "month" {
  if (period === "day") return "day";
  if (period === "week") return "day";
  return "month";
}

function getStep(period: Period): number {
  if (period === "day") return 1;
  if (period === "week") return 7;
  return 1;
}
