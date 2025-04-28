import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { AppState, View, Text, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import Button from "@/components/Button";
import MenuComponent from "@/components/Menu";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/contexts/authContext";
import { ActivityIndicator } from "react-native";

export default function RecordPoint() {
  const { user, token, loading } = useAuth();

  const userName = user?.name
    ? user.name.split(" ")[0].charAt(0).toUpperCase() +
      user.name.split(" ")[0].slice(1)
    : "Usuário";
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerPaused, setTimerPaused] = useState(true);
  const [status, setStatus] = useState({
    clockIn: false,
    lunchStart: false,
    lunchEnd: false,
    clockOut: false,
  });

  // Atualiza a data e hora visível em tempo real
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
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Escuta retorno do app e atualiza status
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchWorkStatus(); // revalida tempo
      }
    });
    return () => subscription.remove();
  }, []);

  // Controla o cronômetro
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (!timerPaused) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer !== null) clearInterval(timer);
    };
  }, [timerPaused]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && token && user) {
        fetchWorkStatus();
      }
    }, [loading, token, user])
  );

  const getAuthData = async () => {
    const storedUserData = await AsyncStorage.getItem("userData");
    const parsed = storedUserData ? JSON.parse(storedUserData) : null;
    const token = parsed?.token;
    const employeeId = parsed?.id;
    const recordId = await AsyncStorage.getItem("recordId");
    return { token, employeeId, recordId };
  };

  const updateStatusAndTimer = async (record: any) => {
    if (record._id) {
      await AsyncStorage.setItem("recordId", record._id);
    }

    const { clockIn, lunchStart, lunchEnd, clockOut } = record;

    setStatus({
      clockIn: !!clockIn,
      lunchStart: !!lunchStart,
      lunchEnd: !!lunchEnd,
      clockOut: !!clockOut,
    });

    if (clockOut) {
      setElapsedTime(0);
      setTimerPaused(true);
      await AsyncStorage.removeItem("recordId");
      return;
    }

    const now = Date.now();
    const start = clockIn ? new Date(clockIn).getTime() : now;

    if (clockIn && lunchStart && !lunchEnd) {
      const diff = new Date(lunchStart).getTime() - start;
      setElapsedTime(Math.floor(diff / 1000));
      setTimerPaused(true);
    } else if (clockIn && lunchStart && lunchEnd) {
      const breakTime =
        new Date(lunchEnd).getTime() - new Date(lunchStart).getTime();
      const worked = now - start - breakTime;
      setElapsedTime(Math.floor(worked / 1000));
      setTimerPaused(false);
    } else if (clockIn) {
      const diff = now - start;
      setElapsedTime(Math.floor(diff / 1000));
      setTimerPaused(false);
    } else {
      setElapsedTime(0);
      setTimerPaused(true);
    }
  };

  const fetchWorkStatus = async () => {
    try {
      const { token } = await getAuthData();
      if (!token) return;

      const todayBrasilia = new Date(Date.now() - 3 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const response = await api.get(
        `/time-records?period=day&startDate=${todayBrasilia}&endDate=${todayBrasilia}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const records = response.data.records;
      if (records.length > 0) {
        await updateStatusAndTimer(records[0]);
      } else {
        setElapsedTime(0);
        setTimerPaused(true);
        setStatus({
          clockIn: false,
          lunchStart: false,
          lunchEnd: false,
          clockOut: false,
        });
      }
    } catch (error: any) {
      const msg = error.response?.data?.error;
      if (error.response?.status === 401) {
        Alert.alert("Sessão expirada", "Faça login novamente.");
      } else if (error.response?.status === 404) {
        Alert.alert(
          "Iniciar Jornada",
          "Você ainda não iniciou a jornada hoje."
        );
      } else {
        Alert.alert("Alert", msg || "Erro ao buscar status da jornada.");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Funções de ações
  const handlePost = async (
    endpoint: string,
    body: object,
    successMsg: string,
    stateUpdate?: () => void
  ) => {
    try {
      const response = await api.post(endpoint, body);
      if (response.status === 200 || response.status === 201) {
        if (stateUpdate) stateUpdate();
        Alert.alert("Sucesso", successMsg);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error;
      Alert.alert("Alert", msg || "Erro ao executar a ação.");
    }
  };

  async function getCurrentLocation() {
    try {
      setIsGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permissão de localização negada.");
      }

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error("O serviço de localização está desativado.");
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (!location) {
        throw new Error("Não foi possível obter a localização.");
      }

      const { latitude, longitude } = location.coords;

      return { latitude, longitude };
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      Alert.alert(
        "Erro de Localização",
        "Não foi possível obter sua localização. Verifique se o GPS está ligado."
      );
      throw error;
    } finally {
      setIsGettingLocation(false);
    }
  }

  const startWorkDay = async () => {
    const { token, employeeId } = await getAuthData();
    if (!token || !employeeId) return;

    const coords = await getCurrentLocation();
    await handlePost(
      "/clock-in",
      { employeeId, ...coords },
      "Jornada iniciada!",
      () => {
        setTimerPaused(false);
        setStatus((s) => ({ ...s, clockIn: true }));
      }
    );
  };

  const startLunch = async () => {
    const { token, recordId } = await getAuthData();
    if (!token || !recordId) return;

    const coords = await getCurrentLocation();
    await handlePost(
      "/lunch-start",
      { recordId, ...coords },
      "Saída para almoço registrada!",
      () => {
        setTimerPaused(true);
        setStatus((s) => ({ ...s, lunchStart: true }));
      }
    );
  };

  const returnFromLunch = async () => {
    const { token, recordId } = await getAuthData();
    if (!token || !recordId) return;

    const coords = await getCurrentLocation();
    await handlePost(
      "/lunch-end",
      { recordId, ...coords },
      "Retorno do almoço registrado!",
      () => {
        setTimerPaused(false);
        setStatus((s) => ({ ...s, lunchEnd: true }));
      }
    );
  };

  const finishWorkDay = async () => {
    const { token, recordId } = await getAuthData();
    if (!token || !recordId) return;

    const coords = await getCurrentLocation();
    await handlePost(
      "/clock-out",
      { recordId, ...coords },
      "Jornada finalizada!",
      async () => {
        await AsyncStorage.multiRemove(["startTime", "recordId"]);
        setElapsedTime(0);
        setTimerPaused(true);
        setStatus({
          clockIn: false,
          lunchStart: false,
          lunchEnd: false,
          clockOut: false,
        });
      }
    );
  };
  if (isGettingLocation) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: "#fff", fontSize: 18, marginTop: 20 }}>
          Obtendo sua localização...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, {userName}!</Text>

      <View style={styles.boxDate}>
        <Text style={styles.Text}>{currentDate}</Text>
        <Text style={styles.Text}>{currentTime}</Text>
      </View>

      <View style={globalStyles.border} />

      <View style={styles.boxClock}>
        <Text style={styles.clockText}>{formatTime(elapsedTime)}</Text>
      </View>

      <View style={styles.boxButton}>
        {status.clockOut ? (
          <Button title="Iniciar Jornada" onPress={startWorkDay} />
        ) : !status.clockIn ? (
          <Button title="Iniciar Jornada" onPress={startWorkDay} />
        ) : !status.lunchStart ? (
          <Button title="Saída Almoço" onPress={startLunch} />
        ) : !status.lunchEnd ? (
          <Button title="Retorno Almoço" onPress={returnFromLunch} />
        ) : (
          <Button title="Finalizar Jornada" onPress={finishWorkDay} />
        )}
      </View>

      <MenuComponent />
    </View>
  );
}

// Styles permanecem os mesmos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#011D4C",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
  },
  boxDate: {
    flexDirection: "row",
    gap: 50,
    marginTop: 50,
    alignItems: "center",
  },
  Text: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
  },
  boxClock: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#011D4C",
    margin: 50,
  },
  clockText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  boxButton: {
    width: "85%",
  },
});
