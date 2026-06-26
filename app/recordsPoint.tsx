import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  AppState,
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatInTimeZone } from "date-fns-tz";
import api from "@/services/api";
import Button from "@/components/Button";
import MenuComponent from "@/components/Menu";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/contexts/authContext";

type WorkStatus = {
  clockIn: boolean;
  lunchStart: boolean;
  lunchEnd: boolean;
  clockOut: boolean;
};

type AlertMessage = {
  title: string;
  description: string;
};

const INITIAL_STATUS: WorkStatus = {
  clockIn: false,
  lunchStart: false,
  lunchEnd: false,
  clockOut: false,
};

const TIME_ZONE = "America/Sao_Paulo";

export default function RecordPoint() {
  const { user, token, loading } = useAuth();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 720 || width < 360;
  const clockSize = Math.min(width * (isSmallScreen ? 0.58 : 0.7), 300);

  const userName = user?.name
    ? user.name.split(" ")[0].charAt(0).toUpperCase() +
      user.name.split(" ")[0].slice(1)
    : "Usuário";

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerPaused, setTimerPaused] = useState(true);
  const [status, setStatus] = useState<WorkStatus>(INITIAL_STATUS);

  const resetWorkStatus = useCallback(async () => {
    await AsyncStorage.removeItem("recordId");
    setElapsedTime(0);
    setTimerPaused(true);
    setStatus(INITIAL_STATUS);
  }, []);

  const getAuthData = async () => {
    const storedUserData = await AsyncStorage.getItem("userData");
    const parsed = storedUserData ? JSON.parse(storedUserData) : null;
    const token = parsed?.token;
    const employeeId = parsed?.id;
    const recordId = await AsyncStorage.getItem("recordId");

    return { token, employeeId, recordId };
  };

  const updateStatusAndTimer = useCallback(
    async (record: any) => {
      if (!record) {
        await resetWorkStatus();
        return;
      }

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
        setElapsedTime(Math.max(0, Math.floor(diff / 1000)));
        setTimerPaused(true);
        return;
      }

      if (clockIn && lunchStart && lunchEnd) {
        const breakTime =
          new Date(lunchEnd).getTime() - new Date(lunchStart).getTime();
        const worked = now - start - breakTime;
        setElapsedTime(Math.max(0, Math.floor(worked / 1000)));
        setTimerPaused(false);
        return;
      }

      if (clockIn) {
        const diff = now - start;
        setElapsedTime(Math.max(0, Math.floor(diff / 1000)));
        setTimerPaused(false);
        return;
      }

      await resetWorkStatus();
    },
    [resetWorkStatus]
  );

  const fetchWorkStatus = useCallback(async () => {
    try {
      const { token } = await getAuthData();
      if (!token) return;

      const todayBrasilia = formatInTimeZone(
        new Date(),
        TIME_ZONE,
        "yyyy-MM-dd"
      );

      const response = await api.get(
        `/time-records?period=day&startDate=${todayBrasilia}&endDate=${todayBrasilia}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const records = response.data?.records || [];

      if (records.length > 0) {
        await updateStatusAndTimer(records[0]);
      } else {
        await resetWorkStatus();
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert("Sessão expirada", "Faça login novamente.");
        return;
      }

      if (error.response?.status === 404) {
        await resetWorkStatus();
        return;
      }

      const msg = error.response?.data?.message || error.response?.data?.error;
      Alert.alert("Erro ao carregar ponto", msg || "Não foi possível consultar sua jornada.");
    }
  }, [resetWorkStatus, updateStatusAndTimer]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const optionsDate = {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: TIME_ZONE,
      } as const;

      setCurrentDate(now.toLocaleDateString("pt-BR", optionsDate));
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: TIME_ZONE,
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchWorkStatus();
      }
    });

    return () => subscription.remove();
  }, [fetchWorkStatus]);

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
    }, [loading, token, user, fetchWorkStatus])
  );

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPointErrorMessage = (message?: string): AlertMessage => {
    const normalized = message?.toLowerCase() ?? "";

    if (
      normalized.includes("já") ||
      normalized.includes("already") ||
      normalized.includes("registrado")
    ) {
      return {
        title: "Ponto já registrado",
        description: message || "Esse ponto já foi registrado hoje.",
      };
    }

    if (
      normalized.includes("localização") ||
      normalized.includes("localizacao") ||
      normalized.includes("distância") ||
      normalized.includes("distancia") ||
      normalized.includes("fora")
    ) {
      return {
        title: "Localização não autorizada",
        description:
          message ||
          "Você precisa estar dentro da área autorizada da empresa para registrar o ponto.",
      };
    }

    if (normalized.includes("almoço") || normalized.includes("almoco")) {
      return {
        title: "Atenção ao intervalo",
        description: message || "Verifique as regras do intervalo de almoço.",
      };
    }

    if (normalized.includes("recordid") || normalized.includes("registro")) {
      return {
        title: "Jornada não encontrada",
        description:
          "Não localizei uma jornada aberta. Atualize a tela e tente novamente.",
      };
    }

    return {
      title: "Não foi possível registrar",
      description: message || "Tente novamente em alguns instantes.",
    };
  };

  const handlePost = async (
    endpoint: string,
    body: object,
    successMsg: string
  ) => {
    try {
      setIsPosting(true);
      const response = await api.post(endpoint, body);

      if (response.status === 200 || response.status === 201) {
        await fetchWorkStatus();
        Alert.alert("Registro realizado", successMsg);
      }
    } catch (error: any) {
      const apiMessage =
        error.response?.data?.message || error.response?.data?.error;
      const alertData = getPointErrorMessage(apiMessage);

      Alert.alert(alertData.title, alertData.description);
      await fetchWorkStatus();
    } finally {
      setIsPosting(false);
    }
  };

  async function getCurrentLocation() {
    try {
      setIsGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso à localização para registrar o ponto."
        );
        throw new Error("Permissão de localização negada.");
      }

      const isEnabled = await Location.hasServicesEnabledAsync();

      if (!isEnabled) {
        Alert.alert(
          "GPS desativado",
          "Ative a localização do celular e tente bater o ponto novamente."
        );
        throw new Error("O serviço de localização está desativado.");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      return { latitude, longitude };
    } finally {
      setIsGettingLocation(false);
    }
  }

  const startWorkDay = async () => {
    const { token, employeeId } = await getAuthData();

    if (!token || !employeeId) {
      Alert.alert("Sessão inválida", "Faça login novamente para registrar o ponto.");
      return;
    }

    const coords = await getCurrentLocation();

    await handlePost(
      "/clock-in",
      { employeeId, ...coords },
      "Entrada registrada com sucesso."
    );
  };

  const startLunch = async () => {
    const { token, recordId } = await getAuthData();

    if (!token || !recordId) {
      Alert.alert(
        "Jornada não encontrada",
        "Não localizei uma jornada aberta. Atualize a tela e tente novamente."
      );
      await fetchWorkStatus();
      return;
    }

    const coords = await getCurrentLocation();

    await handlePost(
      "/lunch-start",
      { recordId, ...coords },
      "Saída para almoço registrada com sucesso."
    );
  };

  const returnFromLunch = async () => {
    const { token, recordId } = await getAuthData();

    if (!token || !recordId) {
      Alert.alert(
        "Jornada não encontrada",
        "Não localizei uma jornada aberta. Atualize a tela e tente novamente."
      );
      await fetchWorkStatus();
      return;
    }

    const coords = await getCurrentLocation();

    await handlePost(
      "/lunch-end",
      { recordId, ...coords },
      "Retorno do almoço registrado com sucesso."
    );
  };

  const finishWorkDay = async () => {
    const { token, recordId } = await getAuthData();

    if (!token || !recordId) {
      Alert.alert(
        "Jornada não encontrada",
        "Não localizei uma jornada aberta. Atualize a tela e tente novamente."
      );
      await fetchWorkStatus();
      return;
    }

    const coords = await getCurrentLocation();

    await handlePost(
      "/clock-out",
      { recordId, ...coords },
      "Jornada finalizada com sucesso."
    );
  };

  const getCurrentAction = () => {
    if (!status.clockIn || status.clockOut) {
      return { title: "Iniciar Jornada", onPress: startWorkDay };
    }

    if (!status.lunchStart) {
      return { title: "Saída Almoço", onPress: startLunch };
    }

    if (!status.lunchEnd) {
      return { title: "Retorno Almoço", onPress: returnFromLunch };
    }

    return { title: "Finalizar Jornada", onPress: finishWorkDay };
  };

  const currentAction = getCurrentAction();
  const actionLoading = isGettingLocation || isPosting;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Carregando seus dados...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Olá, {userName}!</Text>

        <View style={styles.boxDate}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.dateText}>{currentTime}</Text>
        </View>

        <View style={globalStyles.border} />

        <View
          style={[
            styles.boxClock,
            {
              width: clockSize,
              height: clockSize,
              borderRadius: clockSize / 2,
              marginVertical: isSmallScreen ? 22 : 34,
            },
          ]}
        >
          <Text style={[styles.clockText, { fontSize: width < 360 ? 30 : 36 }]}>
            {formatTime(elapsedTime)}
          </Text>
        </View>

        <View style={styles.boxButton}>
          <Button
            title={actionLoading ? "Aguarde..." : currentAction.title}
            onPress={currentAction.onPress}
            disabled={actionLoading}
            loading={actionLoading}
          />
        </View>

        {actionLoading && (
          <Text style={styles.helperText}>Obtendo localização e validando ponto...</Text>
        )}
      </ScrollView>

      <MenuComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#011D4C",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#011D4C",
    paddingHorizontal: 20,
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 118,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
  },
  boxDate: {
    width: "100%",
    flexDirection: "column",
    gap: 6,
    marginTop: 26,
    alignItems: "center",
  },
  dateText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  boxClock: {
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#011D4C",
  },
  clockText: {
    color: "#fff",
    fontWeight: "bold",
  },
  boxButton: {
    width: "100%",
    maxWidth: 420,
  },
  helperText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    opacity: 0.85,
  },
});
