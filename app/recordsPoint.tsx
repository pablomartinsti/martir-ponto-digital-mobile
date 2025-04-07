import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import Button from "@/components/Button";
import MenuComponent from "@/components/Menu";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/contexts/authContext";

export default function RecordPoint() {
  const { user, token } = useAuth();
  const userName = user?.name
    ? user.name.split(" ")[0].charAt(0).toUpperCase() +
      user.name.split(" ")[0].slice(1)
    : "Usuário";
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerPaused, setTimerPaused] = useState(true);
  const [status, setStatus] = useState({
    clockIn: false,
    lunchStart: false,
    lunchEnd: false,
    clockOut: false,
  });

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchWorkStatus();
      }
    }, [token])
  );

  // Atualiza data e hora em tempo real
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const optionsDate = {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      } as const;
      const formattedDate = now.toLocaleDateString("pt-BR", optionsDate);
      const formattedTime = now.toLocaleTimeString("pt-BR");

      setCurrentDate(formattedDate);
      setCurrentTime(formattedTime);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null; // Permite ambos os tipos

    if (!timerPaused) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (timer !== null) {
        clearInterval(timer);
      }
    };
  }, [timerPaused]);

  const getAuthData = async () => {
    const storedUserData = await AsyncStorage.getItem("userData");
    const parsed = storedUserData ? JSON.parse(storedUserData) : null;

    const token = parsed ? parsed.token : null;
    const recordId = await AsyncStorage.getItem("recordId");
    const employeeId = parsed ? parsed.id : null; // Pegando o employeeId do objeto `userData`

    return { token, recordId, employeeId };
  };

  const fetchWorkStatus = async () => {
    try {
      const { token } = await getAuthData();
      if (!token) {
        Alert.alert("Erro", "Usuário não autenticado.");
        return;
      }

      const today = new Date();
      const todayBrasilia = new Date(today.getTime() - 3 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      console.log("📆 Data ajustada para Brasil:", todayBrasilia);

      const response = await api.get(
        `/time-records?period=day&startDate=${todayBrasilia}&endDate=${todayBrasilia}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = response.data.results[0];

      if (!result || !result.records || result.records.length === 0) {
        console.warn("⚠ Nenhum registro retornado pela API.");
        return;
      }

      await updateStatusAndTimer(result.records[0]);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("⚠ Nenhum registro encontrado (404).");
        Alert.alert(
          "Iniciar Jornada",
          "Você ainda não iniciou a jornada de trabalho hoje. Clique em 'Iniciar Jornada' para começar."
        );
        setElapsedTime(0);
        setTimerPaused(true);
        setStatus({
          clockIn: false,
          lunchStart: false,
          lunchEnd: false,
          clockOut: false,
        });
        return;
      }

      console.error("❌ Erro ao buscar status da jornada:", error);
      Alert.alert("Erro", "Não foi possível recuperar o status da jornada.");
    }
  };
  const updateStatusAndTimer = async (record: any) => {
    if (record._id) {
      await AsyncStorage.setItem("recordId", record._id);
    }

    setStatus({
      clockIn: !!record.clockIn,
      lunchStart: !!record.lunchStart,
      lunchEnd: !!record.lunchEnd,
      clockOut: !!record.clockOut,
    });

    if (record.clockIn) {
      const startTime = new Date(record.clockIn).getTime();
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      setElapsedTime(elapsedSeconds);
      setTimerPaused(false);
    } else {
      setElapsedTime(0);
      setTimerPaused(true);
    }
  };

  // Formata o tempo decorrido
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startWorkDay = async () => {
    try {
      const { token, employeeId } = await getAuthData();

      if (!token || !employeeId) {
        Alert.alert("Erro", "Usuário não autenticado.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Erro", "Permissão de localização negada.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await api.post(
        "/clock-in",
        { employeeId, latitude, longitude },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        const { _id: recordId } = response.data;
        const startTime = new Date().getTime(); // 🔹 Captura a hora de início
        await AsyncStorage.setItem("startTime", startTime.toString()); // 🔹 Salva no AsyncStorage

        await AsyncStorage.setItem("recordId", recordId);
        setTimerPaused(false);
        setStatus((prev) => ({ ...prev, clockIn: true })); // Atualiza o estado
        Alert.alert("Sucesso", "Jornada de trabalho iniciada!");
      } else {
        Alert.alert("Erro", "Não foi possível iniciar a jornada.");
      }
    } catch (error) {
      console.error("Erro ao iniciar jornada:", error);
      Alert.alert("Alerta", "Você já concluir sua jornada hoje!");
    }
  };

  const startLunch = async () => {
    try {
      const { token, recordId } = await getAuthData();

      if (!token || !recordId) {
        Alert.alert(
          "Erro",
          "Usuário não autenticado ou registro não encontrado."
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Erro", "Permissão de localização negada.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await api.post(
        "/lunch-start",
        { recordId, latitude, longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        setTimerPaused(true);
        setStatus((prev) => ({ ...prev, lunchStart: true }));
        Alert.alert("Sucesso", "Saída para almoço registrada!");
      } else {
        Alert.alert("Erro", "Não foi possível registrar a saída para almoço.");
      }
    } catch (error) {
      console.error("Erro ao registrar saída para almoço:", error);
      Alert.alert("Erro", "Erro ao registrar saída para almoço.");
    }
  };

  const returnFromLunch = async () => {
    try {
      const { token, recordId } = await getAuthData();

      if (!token || !recordId) {
        Alert.alert(
          "Erro",
          "Usuário não autenticado ou registro não encontrado."
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Erro", "Permissão de localização negada.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await api.post(
        "/lunch-end",
        { recordId, latitude, longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        setTimerPaused(false);
        setStatus((prev) => ({ ...prev, lunchEnd: true }));
        Alert.alert("Sucesso", "Retorno do almoço registrado!");
      } else {
        Alert.alert("Erro", "Não foi possível registrar o retorno do almoço.");
      }
    } catch (error) {
      console.error("Erro ao registrar retorno do almoço:", error);
      Alert.alert("Erro", "Erro ao registrar retorno do almoço.");
    }
  };

  const finishWorkDay = async () => {
    try {
      const { token, recordId } = await getAuthData();

      if (!token || !recordId) {
        Alert.alert(
          "Erro",
          "Usuário não autenticado ou registro não encontrado."
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Erro", "Permissão de localização negada.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await api.post(
        "/clock-out",
        { recordId, latitude, longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        await AsyncStorage.multiRemove(["startTime", "recordId"]);
        setElapsedTime(0);
        setTimerPaused(true);
        setStatus({
          clockIn: false,
          lunchStart: false,
          lunchEnd: false,
          clockOut: false,
        });

        Alert.alert("Sucesso", "Jornada finalizada!");
      } else {
        Alert.alert("Erro", "Não foi possível finalizar a jornada.");
      }
    } catch (error) {
      console.error("Erro ao finalizar jornada:", error);
      Alert.alert("Erro", "Erro ao finalizar a jornada.");
    }
  };

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
        {!status.clockIn ? (
          // Botão para iniciar a jornada

          <Button title="Iniciar Jornada" onPress={startWorkDay} />
        ) : !status.lunchStart ? (
          // Botão para saída para almoço
          <Button title="Saída Almoço" onPress={startLunch} />
        ) : !status.lunchEnd ? (
          // Botão para retorno do almoço

          <Button title="Retorno Almoço" onPress={returnFromLunch} />
        ) : (
          // Botão para finalizar jornada
          <Button title="Finalizar Jornada" onPress={finishWorkDay} />
        )}
      </View>
      <MenuComponent />
    </View>
  );
}

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
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    gap: 50,
    marginTop: 50,
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
