import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedEmployeeId = await AsyncStorage.getItem("employeeId");
        const storedName = await AsyncStorage.getItem("employeeName");
        const storedRecordId = await AsyncStorage.getItem("recordId");
        const storedStartTime = await AsyncStorage.getItem("startTime");

        if (!storedToken || !storedEmployeeId) {
          Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
          router.push("/login");
          return;
        }

        setUserName(storedName || "Usuário");

        // Recupera o recordId se existir (para continuar o fluxo corretamente)
        if (storedRecordId) {
          setStatus((prev) => ({ ...prev, clockIn: true }));
        }

        if (storedStartTime) {
          const startTime = parseInt(storedStartTime, 10);
          const currentTime = new Date().getTime();
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000); // 🔹 Calcula tempo decorrido
          setElapsedTime(elapsedSeconds);
          setTimerPaused(false);
        }
      } catch (error) {
        console.error("Erro ao recuperar dados do usuário:", error);
      }
    };

    loadUserData();
  }, []);

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

  // Formata o tempo decorrido
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  useEffect(() => {
    const loadStatusFromStorage = async () => {
      try {
        const storedStatus = await AsyncStorage.getItem("workStatus");
        const storedElapsedTime = await AsyncStorage.getItem("elapsedTime");
        const storedTimerPaused = await AsyncStorage.getItem("timerPaused");

        if (storedStatus) {
          setStatus(JSON.parse(storedStatus));
        }

        if (storedElapsedTime) {
          setElapsedTime(parseInt(storedElapsedTime, 10));
        }

        if (storedTimerPaused) {
          setTimerPaused(JSON.parse(storedTimerPaused));
        }
      } catch (error) {
        console.error("Erro ao recuperar status do AsyncStorage:", error);
      }
    };

    loadStatusFromStorage();
  }, []);

  useEffect(() => {
    const saveStatusToStorage = async () => {
      try {
        await AsyncStorage.setItem("workStatus", JSON.stringify(status));
        await AsyncStorage.setItem("elapsedTime", elapsedTime.toString());
        await AsyncStorage.setItem("timerPaused", JSON.stringify(timerPaused));
      } catch (error) {
        console.error("Erro ao salvar status no AsyncStorage:", error);
      }
    };

    saveStatusToStorage();
  }, [status, elapsedTime, timerPaused]);

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

  const logout = async () => {
    try {
      AsyncStorage.clear();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
      Alert.alert("Erro", "Não foi possível sair.");
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
