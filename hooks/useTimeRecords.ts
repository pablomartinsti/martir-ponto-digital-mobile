import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import api from "@/services/api";
import { formatDate } from "@/utils/dateUtils";

// Tipos permitidos de período de filtro
type Period = "day" | "week" | "month";

// Interface com os dados retornados pelo hook
interface UseTimeRecordsResult {
  data: any; // Pode ser 1 objeto (day) ou lista (week/month)
  loading: boolean;
  errorMessage: string;
  goToNext: () => void; // Navega para o próximo período
  goToPrev: () => void; // Navega para o período anterior
  periodLabel: string; // Texto exibido no cabeçalho (ex: "Abril de 2025")
  canGoNext: boolean; // Define se pode navegar para o próximo período
}

export function useTimeRecords(period: Period): UseTimeRecordsResult {
  // Data de hoje, sempre no timezone de São Paulo
  const today = dayjs().tz("America/Sao_Paulo").startOf("day");

  // Data de referência usada para navegação (ex: o dia/semana/mês atual no filtro)
  const [referenceDate, setReferenceDate] = useState(() =>
    today.startOf(getUnit(period))
  );

  // Estado para armazenar os dados de ponto (1 registro ou lista)
  const [data, setData] = useState<any>(period === "day" ? null : []);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Função que define o intervalo de datas (startDate e endDate) de acordo com o período selecionado
  const getRange = () => {
    if (period === "day") {
      return {
        startDate: referenceDate,
        endDate: referenceDate,
      };
    }
    if (period === "week") {
      const start = referenceDate.day(0); // Domingo
      const end = referenceDate.day(6); // Sábado
      return { startDate: start, endDate: end };
    }
    // Caso "month"
    const start = referenceDate.startOf("month");
    const end = referenceDate.endOf("month");
    return { startDate: start, endDate: end };
  };

  // Função responsável por buscar os dados da API
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setData(period === "day" ? null : []);

    const { startDate, endDate } = getRange();

    // Impede busca futura
    if (startDate.isAfter(today)) {
      setErrorMessage("Não é possível visualizar registros futuros.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(
        `/time-records?period=${period}&startDate=${formatDate(
          startDate.toDate()
        )}&endDate=${formatDate(endDate.toDate())}`
      );

      const responseData = response.data;

      if (!responseData.records || responseData.records.length === 0) {
        setErrorMessage("Nenhum registro encontrado.");
      } else {
        setData(responseData); // ✅ agora você salva tudo
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

  // Dispara a busca toda vez que a referência mudar
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Função para navegar para o próximo período (dia, semana ou mês)
  const goToNext = () => {
    const nextDate = referenceDate
      .add(getStep(period), getUnit(period))
      .startOf(getUnit(period));

    // Bloqueia se a próxima data for no futuro
    if (nextDate.isAfter(today)) return;

    setReferenceDate(nextDate);
  };

  // Função para voltar ao período anterior
  const goToPrev = () => {
    setReferenceDate(
      referenceDate
        .subtract(getStep(period), getUnit(period))
        .startOf(getUnit(period))
    );
  };

  // Gera o rótulo exibido no cabeçalho da tela, baseado no período atual
  const periodLabel = (() => {
    if (period === "day") return referenceDate.format("DD/MM/YYYY");

    if (period === "week") {
      const start = referenceDate.day(0).format("DD/MM/YYYY");
      const end = referenceDate.day(6).format("DD/MM/YYYY");
      return `${start} - ${end}`;
    }

    // Mês por extenso: Abril de 2025
    return referenceDate
      .locale("pt-br")
      .format("MMMM [de] YYYY")
      .replace(/^./, (c) => c.toUpperCase());
  })();

  // Define se o botão "próximo" deve estar habilitado (evita ir além de hoje)
  const canGoNext = (() => {
    const next = referenceDate
      .add(getStep(period), getUnit(period))
      .startOf(getUnit(period));

    return !next.isAfter(today);
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

// Define a unidade usada para navegação (por exemplo: .add(1, "day"))
function getUnit(period: Period): "day" | "week" | "month" {
  if (period === "day") return "day";
  if (period === "week") return "day"; // usamos day para controlar dias da semana com .day(0), .day(6)
  return "month";
}

// Define o número de unidades a avançar ou retroceder (ex: 1 dia, 7 dias, 1 mês)
function getStep(period: Period): number {
  if (period === "day") return 1;
  if (period === "week") return 7;
  return 1;
}
