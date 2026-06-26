import { useEffect, useState } from "react";
import { Alert, AppState } from "react-native";
import {
  clockIn,
  clockOut,
  lunchStart,
  lunchEnd,
  getTodayRecord,
} from "@/services/recordPointService";
import { getRecordId, getStoredUserData, setRecordId, clearRecordId } from "@/services/storageService";
import { getCurrentCoordinates } from "@/services/locationService";
import { useClock } from "@/hooks/useClock";
import { TimeRecord } from "@/types/timeRecord";

export function useRecordPoint() {
  const {
    currentDate,
    currentTime,
    elapsedTime,
    startTimer,
    pauseTimer,
    resetTimer,
    setCustomElapsedTime,
    formatTime,
  } = useClock();

  const [status, setStatus] = useState({
    clockIn: false,
    lunchStart: false,
    lunchEnd: false,
    clockOut: false,
  });

  useEffect(() => {
    fetchWorkStatus();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchWorkStatus();
    });

    return () => subscription.remove();
  }, []);

  const getAuthData = async () => {
    const userData = await getStoredUserData();
    const recordId = await getRecordId();
    return { token: userData?.token, employeeId: userData?.id, recordId };
  };

  const updateStatusAndTimer = async (record: TimeRecord) => {
    const { clockIn: entry, lunchStart: lunchOut, lunchEnd: lunchBack, clockOut: exit } = record;

    setStatus({
      clockIn: !!entry,
      lunchStart: !!lunchOut,
      lunchEnd: !!lunchBack,
      clockOut: !!exit,
    });

    if (record._id) {
      await setRecordId(record._id);
    }

    if (exit) {
      resetTimer();
      await clearRecordId();
      return;
    }

    const now = Date.now();
    const start = entry ? new Date(entry).getTime() : now;

    if (entry && lunchOut && !lunchBack) {
      const workedBeforeLunch = new Date(lunchOut).getTime() - start;
      setCustomElapsedTime(Math.max(0, Math.floor(workedBeforeLunch / 1000)));
      pauseTimer();
      return;
    }

    if (entry && lunchOut && lunchBack) {
      const breakTime = new Date(lunchBack).getTime() - new Date(lunchOut).getTime();
      const worked = now - start - breakTime;
      setCustomElapsedTime(Math.max(0, Math.floor(worked / 1000)));
      startTimer();
      return;
    }

    if (entry) {
      const worked = now - start;
      setCustomElapsedTime(Math.max(0, Math.floor(worked / 1000)));
      startTimer();
      return;
    }

    resetStatus();
  };

  const fetchWorkStatus = async () => {
    try {
      const { token } = await getAuthData();
      if (!token) return;

      const record = await getTodayRecord();

      if (record) {
        await updateStatusAndTimer(record);
      } else {
        resetStatus();
      }
    } catch (error: any) {
      Alert.alert("Aviso", error.response?.data?.error || error.message || "Erro ao buscar status.");
    }
  };

  const resetStatus = () => {
    resetTimer();
    pauseTimer();
    setStatus({
      clockIn: false,
      lunchStart: false,
      lunchEnd: false,
      clockOut: false,
    });
  };

  const startWorkDay = async () => {
    try {
      const { token } = await getAuthData();
      if (!token) return;

      const coordinates = await getCurrentCoordinates();
      const { data } = await clockIn(coordinates.latitude, coordinates.longitude);

      await setRecordId(data._id);
      await updateStatusAndTimer(data);
      Alert.alert("Sucesso", "Jornada iniciada.");
    } catch (error: any) {
      Alert.alert("Aviso", error.response?.data?.error || error.message || "Erro ao iniciar jornada.");
    }
  };

  const startLunch = async () => {
    try {
      const { token, recordId } = await getAuthData();
      if (!token || !recordId) return;

      const coordinates = await getCurrentCoordinates();
      const { data } = await lunchStart(recordId, coordinates.latitude, coordinates.longitude);

      await updateStatusAndTimer(data);
      Alert.alert("Sucesso", "Saída para almoço registrada.");
    } catch (error: any) {
      Alert.alert("Aviso", error.response?.data?.error || error.message || "Erro ao sair para almoço.");
    }
  };

  const returnFromLunch = async () => {
    try {
      const { token, recordId } = await getAuthData();
      if (!token || !recordId) return;

      const coordinates = await getCurrentCoordinates();
      const { data } = await lunchEnd(recordId, coordinates.latitude, coordinates.longitude);

      await updateStatusAndTimer(data);
      Alert.alert("Sucesso", "Retorno do almoço registrado.");
    } catch (error: any) {
      Alert.alert("Aviso", error.response?.data?.error || error.message || "Erro ao retornar do almoço.");
    }
  };

  const finishWorkDay = async () => {
    try {
      const { token, recordId } = await getAuthData();
      if (!token || !recordId) return;

      const coordinates = await getCurrentCoordinates();
      const { data } = await clockOut(recordId, coordinates.latitude, coordinates.longitude);

      await updateStatusAndTimer(data);
      await clearRecordId();
      resetStatus();
      Alert.alert("Sucesso", "Jornada finalizada.");
    } catch (error: any) {
      Alert.alert("Aviso", error.response?.data?.error || error.message || "Erro ao finalizar jornada.");
    }
  };

  return {
    currentDate,
    currentTime,
    elapsedTime,
    status,
    formatTime,
    startWorkDay,
    startLunch,
    returnFromLunch,
    finishWorkDay,
  };
}
