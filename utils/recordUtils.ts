import api from "@/services/api";

export const fetchTimeRecords = async (
  token: string,
  period: "day" | "week" | "month",
  startDate: string,
  endDate: string
): Promise<{
  records: any[];
  totalPositiveHours?: string;
  totalNegativeHours?: string;
  finalBalance?: string;
}> => {
  try {
    const response = await api.get(
      `/time-records?period=${period}&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const results = response.data?.results || [];

    const records = results.flatMap((r: any) => r.records || []);

    return {
      records,
      totalPositiveHours: response.data?.totalPositiveHours,
      totalNegativeHours: response.data?.totalNegativeHours,
      finalBalance: response.data?.finalBalance,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { records: [] };
    }
    console.error("Erro ao buscar registros:", error);
    throw new Error("Erro ao carregar registros.");
  }
};
