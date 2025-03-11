import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import api from "@/services/api";
import Button from "@/components/Button";
import MenuComponent from "@/components/Menu";

export default function RecordPoint() {
  const [userName, setUserName] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerPaused, setTimerPaused] = useState(true);
  const [status, setStatus] = useState({
    clockIn: false, // Jornada iniciada
    lunchStart: false, // Saída para almoço
    lunchEnd: false, // Retorno do almoço
    clockOut: false, // Jornada finalizada
  });
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchWorkStatus();
    }, [])
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

  useEffect(() => {
    fetchWorkStatus();
  }, []);

  useEffect(() => {
    loadUserName();
  }, []);

  const loadUserName = async () => {
    try {
      const storedName = await AsyncStorage.getItem("employeeName");

      if (storedName) {
        // 🔹 Pega apenas o primeiro nome
        const firstName = storedName.split(" ")[0];
        setUserName(firstName);
      } else {
        setUserName("Usuário"); // Nome padrão caso não encontre no AsyncStorage
      }
    } catch (error) {
      console.error("❌ Erro ao recuperar o nome do usuário:", error);
      setUserName("Usuário");
    }
  };

  const fetchWorkStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const employeeId = await AsyncStorage.getItem("employeeId");

      if (!token || !employeeId) {
        Alert.alert("Erro", "Usuário não autenticado.");
        return;
      }

      console.log("🔄 Buscando status da jornada na API...");

      const response = await api.get(`/time-records?period=day`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📥 Dados da API recebidos:", response.data);

      if (response.status === 200) {
        const data = response.data.dailyResults[0];

        if (!data) {
          console.log(
            "⚠ Nenhum registro encontrado para hoje. Resetando estado..."
          );

          Alert.alert(
            "Iniciar Jornada",
            "Você ainda não iniciou a jornada de trabalho hoje. Clique em 'Iniciar Jornada' para começar."
          );

          setStatus({
            clockIn: false,
            lunchStart: false,
            lunchEnd: false,
            clockOut: false,
          });
          setElapsedTime(0);
          setTimerPaused(true);
          await AsyncStorage.removeItem("recordId");
          return;
        }

        console.log("✅ Registro encontrado:", data);

        // 🔹 Se a jornada já foi finalizada, garantir que o botão volte para "Iniciar Jornada"
        if (data.clockOut) {
          console.log(
            "🚀 Jornada já finalizada. Resetando estado para 'Iniciar Jornada'..."
          );
          setStatus({
            clockIn: false,
            lunchStart: false,
            lunchEnd: false,
            clockOut: false,
          });
          setElapsedTime(0);
          setTimerPaused(true);
          await AsyncStorage.removeItem("recordId");
          return;
        }

        // 🔹 Caso contrário, definir o estado conforme os dados retornados pela API
        setStatus({
          clockIn: !!data.clockIn,
          lunchStart: !!data.lunchStart,
          lunchEnd: !!data.lunchEnd,
          clockOut: !!data.clockOut,
        });

        await AsyncStorage.setItem("recordId", data._id);

        const currentTime = new Date().getTime();
        let elapsedSeconds = 0;

        if (data.clockIn && !data.clockOut) {
          let startTime = new Date(data.clockIn).getTime();
          let pauseTime = data.lunchStart
            ? new Date(data.lunchStart).getTime()
            : null;
          let resumeTime = data.lunchEnd
            ? new Date(data.lunchEnd).getTime()
            : null;

          if (!data.lunchStart) {
            elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
            setTimerPaused(false);
          } else if (data.lunchStart && !data.lunchEnd) {
            elapsedSeconds = Math.floor((pauseTime! - startTime) / 1000);
            setTimerPaused(true);
          } else if (data.lunchEnd) {
            elapsedSeconds =
              Math.floor((pauseTime! - startTime) / 1000) +
              Math.floor((currentTime - resumeTime!) / 1000);
            setTimerPaused(false);
          }

          setElapsedTime(elapsedSeconds);
        } else {
          setElapsedTime(0);
          setTimerPaused(true);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          console.warn(
            "⚠ Nenhum registro de jornada encontrado para hoje. Resetando estado..."
          );

          Alert.alert(
            "Iniciar Jornada",
            "Você ainda não iniciou a jornada de trabalho hoje. Clique em 'Iniciar Jornada' para começar."
          );

          setStatus({
            clockIn: false,
            lunchStart: false,
            lunchEnd: false,
            clockOut: false,
          });
          setElapsedTime(0);
          setTimerPaused(true);
          await AsyncStorage.removeItem("recordId");
          return;
        }
        console.error("❌ Erro ao buscar status da jornada:", error.message);
        Alert.alert(
          "Erro",
          `Não foi possível recuperar o status da jornada: ${error.message}`
        );
      } else {
        console.error("❌ Erro desconhecido:", error);
        Alert.alert("Erro", "Não foi possível recuperar o status da jornada.");
      }
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
      const token = await AsyncStorage.getItem("token");
      const employeeId = await AsyncStorage.getItem("employeeId");

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
      const token = await AsyncStorage.getItem("token");
      const recordId = await AsyncStorage.getItem("recordId");

      if (!token || !recordId) {
        Alert.alert(
          "Erro",
          "Usuário não autenticado ou registro não encontrado."
        );
        return;
      }

      const response = await api.post(
        "/lunch-start",
        { recordId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        setTimerPaused(true);
        setStatus((prev) => ({ ...prev, lunchStart: true })); // Atualiza o estado
        Alert.alert("Sucesso", "Saída para almoço registrada!");
      } else {
        Alert.alert("Erro", "Não foi possível registrar a saída para almoço.");
      }
    } catch (error) {
      console.error("Erro ao registrar saída para almoço:", error);
      Alert.alert("Erro", "Não foi possível registrar a saída para almoço.");
    }
  };

  const returnFromLunch = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const recordId = await AsyncStorage.getItem("recordId");

      if (!token || !recordId) {
        Alert.alert(
          "Erro",
          "Usuário não autenticado ou registro não encontrado."
        );
        return;
      }

      const response = await api.post(
        "/lunch-end",
        { recordId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        setTimerPaused(false);
        setStatus((prev) => ({ ...prev, lunchEnd: true })); // Atualiza o estado
        Alert.alert("Sucesso", "Retorno do almoço registrado!");
      } else {
        Alert.alert("Erro", "Não foi possível registrar o retorno do almoço.");
      }
    } catch (error) {
      console.error("Erro ao registrar retorno do almoço:", error);
      Alert.alert("Erro", "Não foi possível registrar o retorno do almoço.");
    }
  };

  const finishWorkDay = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const recordId = await AsyncStorage.getItem("recordId");

      if (!token || !recordId) {
        Alert.alert(
          "Erro",
          "Usuário não autenticado ou registro não encontrado."
        );
        return;
      }

      const response = await api.post(
        "/clock-out",
        { recordId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        await AsyncStorage.removeItem("startTime"); // 🔹 Remove a hora de início
        await AsyncStorage.removeItem("recordId");

        setElapsedTime(0); // Reseta o cronômetro
        setTimerPaused(true); // Pausa o cronômetro
        setStatus({
          clockIn: false,
          lunchStart: false,
          lunchEnd: false,
          clockOut: false,
        }); // Reseta o status

        Alert.alert("Sucesso", "Jornada finalizada!");
      } else {
        Alert.alert("Erro", "Não foi possível finalizar a jornada.");
      }
    } catch (error) {
      console.error("Erro ao finalizar jornada:", error);
      Alert.alert("Erro", "Não foi possível finalizar a jornada.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, {userName}!</Text>

      <View style={styles.dateTimeContainer}>
        <Text style={styles.dateText}>{currentDate}</Text>
        <Text style={styles.timeText}>{currentTime}</Text>
      </View>
      <View style={styles.border} />

      <View style={styles.timer}>
        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
      </View>
      <View style={styles.view}>
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
  dateTimeContainer: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    gap: 50,
    marginTop: 50,
  },
  dateText: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
  },
  timeText: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    marginLeft: 10,
  },
  border: {
    width: "100%",
    borderBottomColor: "#fff",
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  timer: {
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
  timerText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  menuContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 30,
    position: "absolute",
    bottom: 0,
    backgroundColor: "#E8B931",
  },
  menuButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  view: {
    width: "85%",
  },
});
