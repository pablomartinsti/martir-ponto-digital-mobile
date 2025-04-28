import { useEffect, useState } from "react";
import { Alert, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clockIn,
  clockOut,
  lunchStart,
  lunchEnd,
  getTodayRecord,
} from "@/services/recordPointService";
import { useClock } from "@/hooks/useClock";

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

  // Atualiza status ao voltar do background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchWorkStatus();
    });
    return () => subscription.remove();
  }, []);

  const getAuthData = async () => {
    const data = await AsyncStorage.getItem("userData");
    const parsed = data ? JSON.parse(data) : null;
    const recordId = await AsyncStorage.getItem("recordId");
    return { token: parsed?.token, employeeId: parsed?.id, recordId };
  };

  const updateStatusAndTimer = (record: any) => {
    const { clockIn, lunchStart, lunchEnd, clockOut } = record;

    setStatus({
      clockIn: !!clockIn,
      lunchStart: !!lunchStart,
      lunchEnd: !!lunchEnd,
      clockOut: !!clockOut,
    });

    if (clockOut) {
      resetTimer();
      AsyncStorage.removeItem("recordId");
      return;
    }

    const now = Date.now();
    const start = clockIn ? new Date(clockIn).getTime() : now;

    if (clockIn && lunchStart && !lunchEnd) {
      const diff = new Date(lunchStart).getTime() - start;
      setCustomElapsedTime(Math.floor(diff / 1000));
      pauseTimer();
    } else if (clockIn && lunchStart && lunchEnd) {
      const breakTime =
        new Date(lunchEnd).getTime() - new Date(lunchStart).getTime();
      const worked = now - start - breakTime;
      setCustomElapsedTime(Math.floor(worked / 1000));
      startTimer();
    } else if (clockIn) {
      const diff = now - start;
      setCustomElapsedTime(Math.floor(diff / 1000));
      startTimer();
    } else {
      resetTimer();
      pauseTimer();
    }
  };

  const fetchWorkStatus = async () => {
    try {
      const { token } = await getAuthData();
      if (!token) return;

      const response = await getTodayRecord(token);
      const records = response.data.records;
      if (records.length > 0) {
        await AsyncStorage.setItem("recordId", records[0]._id);
        updateStatusAndTimer(records[0]);
      } else {
        resetStatus();
      }
    } catch (error: any) {
      Alert.alert(
        "Alert",
        error.response?.data?.error || "Erro ao buscar status."
      );
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
      const { token, employeeId } = await getAuthData();
      if (!token || !employeeId) return;

      const { data } = await clockIn(employeeId, -18.9127814, -48.1886814);
      await AsyncStorage.setItem("recordId", data._id);
      startTimer();
      setStatus((prev) => ({ ...prev, clockIn: true }));
      Alert.alert("Sucesso", "Jornada iniciada!");
    } catch (error: any) {
      Alert.alert(
        "Alert",
        error.response?.data?.error || "Erro ao iniciar jornada."
      );
    }
  };

  const startLunch = async () => {
    try {
      const { token, recordId } = await getAuthData();
      if (!token || !recordId) return;

      await lunchStart(recordId, -18.9127814, -48.1886814);
      pauseTimer();
      setStatus((prev) => ({ ...prev, lunchStart: true }));
      Alert.alert("Sucesso", "Saída para almoço registrada!");
    } catch (error: any) {
      Alert.alert(
        "Alert",
        error.response?.data?.error || "Erro ao sair para almoço."
      );
    }
  };

  const returnFromLunch = async () => {
    try {
      const { token, recordId } = await getAuthData();
      if (!token || !recordId) return;

      await lunchEnd(recordId, -18.9127814, -48.1886814);
      startTimer();
      setStatus((prev) => ({ ...prev, lunchEnd: true }));
      Alert.alert("Sucesso", "Retorno do almoço registrado!");
    } catch (error: any) {
      Alert.alert(
        "Alert",
        error.response?.data?.error || "Erro ao retornar do almoço."
      );
    }
  };

  const finishWorkDay = async () => {
    try {
      const { token, recordId } = await getAuthData();
      if (!token || !recordId) return;

      await clockOut(recordId, -18.9127814, -48.1886814);
      await AsyncStorage.multiRemove(["startTime", "recordId"]);
      resetStatus();
      Alert.alert("Sucesso", "Jornada finalizada!");
    } catch (error: any) {
      Alert.alert(
        "Alert",
        error.response?.data?.error || "Erro ao finalizar jornada."
      );
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
