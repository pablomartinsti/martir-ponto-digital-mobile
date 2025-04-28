import api from "@/services/api";

export async function clockIn(
  employeeId: string,
  latitude: number,
  longitude: number
) {
  return api.post("/clock-in", { employeeId, latitude, longitude });
}

export async function clockOut(
  recordId: string,
  latitude: number,
  longitude: number
) {
  return api.post("/clock-out", { recordId, latitude, longitude });
}

export async function lunchStart(
  recordId: string,
  latitude: number,
  longitude: number
) {
  return api.post("/lunch-start", { recordId, latitude, longitude });
}

export async function lunchEnd(
  recordId: string,
  latitude: number,
  longitude: number
) {
  return api.post("/lunch-end", { recordId, latitude, longitude });
}

export async function getTodayRecord(token: string) {
  const todayBrasilia = new Date(Date.now() - 3 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return api.get(
    `/time-records?period=day&startDate=${todayBrasilia}&endDate=${todayBrasilia}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}
