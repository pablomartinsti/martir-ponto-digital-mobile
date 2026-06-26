import api from "@/services/api";
import { TimeRecord, TimeRecordsResponse } from "@/types/timeRecord";
import { formatDate } from "@/utils/dateUtils";

export async function clockIn(latitude: number, longitude: number) {
  return api.post<TimeRecord>("/clock-in", { latitude, longitude });
}

export async function clockOut(recordId: string, latitude: number, longitude: number) {
  return api.post<TimeRecord>("/clock-out", { recordId, latitude, longitude });
}

export async function lunchStart(recordId: string, latitude: number, longitude: number) {
  return api.post<TimeRecord>("/lunch-start", { recordId, latitude, longitude });
}

export async function lunchEnd(recordId: string, latitude: number, longitude: number) {
  return api.post<TimeRecord>("/lunch-end", { recordId, latitude, longitude });
}

export async function getTodayRecord() {
  const response = await api.get<{ record: TimeRecord | null }>("/time-records/today");
  return response.data.record;
}

export async function getTimeRecords(period: "day" | "week" | "month", startDate: Date, endDate: Date) {
  const response = await api.get<TimeRecordsResponse>("/time-records", {
    params: {
      period,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
  });

  return response.data;
}
