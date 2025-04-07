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
import {
  formatDateUTCMinus3,
  resetWorkState,
  calculateElapsedTime,
} from "@/utils/workUtils";
import {
  getFormattedCurrentDate,
  getFormattedCurrentTime,
  formatSecondsToTime,
} from "../utils/dateTimeUtils"; // ajuste o caminho conforme seu projeto

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

  const fetchWorkStatus = useCallback(async () => {
    if (!token) {
      return;
    }

    const today = formatDateUTCMinus3(new Date());

    try {
      const response = await api.get(
        `/time-records?period=day&startDate=${today}&endDate=${today}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data.results[0]?.records[0];

      if (!data || data.clockOut) {
        await resetWorkState(setStatus, setElapsedTime, setTimerPaused);
        return;
      }

      setStatus({
        clockIn: !!data.clockIn,
        lunchStart: !!data.lunchStart,
        lunchEnd: !!data.lunchEnd,
        clockOut: !!data.clockOut,
      });

      await AsyncStorage.setItem("recordId", data._id);

      const { time, paused } = calculateElapsedTime(
        data.clockIn,
        data.lunchStart,
        data.lunchEnd
      );

      setElapsedTime(time);
      setTimerPaused(paused);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // ✅ Caso não exista registro para o dia, permite iniciar a jornada
        await resetWorkState(setStatus, setElapsedTime, setTimerPaused);
        return;
      }

      if (error.response?.status === 401) {
        Alert.alert("Sessão expirada", "Faça login novamente.");
        return;
      }

      console.error("Erro ao buscar status da jornada:", error);
      Alert.alert("Erro", "Não foi possível recuperar o status da jornada.");
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkStatus();
    }, [fetchWorkStatus])
  );

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDate(getFormattedCurrentDate());
      setCurrentTime(getFormattedCurrentTime());
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
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

  const startWorkDay = async () => {
    try {
      if (!token || !user?.id) {
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
        { employeeId: user.id, latitude, longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        await AsyncStorage.setItem("recordId", response.data._id);
        setTimerPaused(false);
        setStatus((prev) => ({ ...prev, clockIn: true }));
        Alert.alert("Sucesso", "Jornada de trabalho iniciada!");
        await fetchWorkStatus();
      } else {
        Alert.alert("Erro", "Não foi possível iniciar a jornada.");
      }
    } catch (error) {
      console.error("Erro ao iniciar jornada:", error);
      Alert.alert("Erro", "Você já concluiu sua jornada hoje!");
    }
  };

  const startLunch = async () => {
    try {
      const recordId = await AsyncStorage.getItem("recordId");
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
        await fetchWorkStatus();
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
      const recordId = await AsyncStorage.getItem("recordId");
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
        await fetchWorkStatus();
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
      const recordId = await AsyncStorage.getItem("recordId");
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
        await fetchWorkStatus();
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
        <Text style={styles.clockText}>{formatSecondsToTime(elapsedTime)}</Text>
      </View>

      <View style={styles.boxButton}>
        {!status.clockIn ? (
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
