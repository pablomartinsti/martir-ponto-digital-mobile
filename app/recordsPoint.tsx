import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Location from "expo-location";
import api from "@/services/api";

export default function RecordPoint() {
  const [userName, setUserName] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0); // Tempo decorrido
  const [timerPaused, setTimerPaused] = useState(true); // Controle do cronômetro
  const [isWorking, setIsWorking] = useState(false);
  const [isOnLunch, setIsOnLunch] = useState(false);
  const router = useRouter();

  // Recupera o nome do usuário
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedName = await AsyncStorage.getItem("employeeName");
        setUserName(storedName || "Usuário");
      } catch (error) {
        console.error("Erro ao recuperar o nome do usuário:", error);
        setUserName("Usuário");
      }
    };

    fetchUserName();
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

  // Lógica do cronômetro
  useEffect(() => {
    let timer: NodeJS.Timer | null = null;

    if (!timerPaused) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (timer) {
      clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
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

  // Ações dos botões
  const startWorkDay = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const employeeId = await AsyncStorage.getItem("employeeId");
      const lastWorkDate = await AsyncStorage.getItem("lastWorkDate"); // Data da última jornada

      if (!token || !employeeId) {
        Alert.alert("Erro", "Usuário não autenticado.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // Verifica se a última jornada foi no mesmo dia
      if (lastWorkDate === today) {
        Alert.alert(
          "Aviso",
          "Você já bateu ponto hoje. Aproveite seu descanso!"
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
        await AsyncStorage.setItem("recordId", recordId);
        setIsWorking(true);
        setIsOnLunch(false);
        setElapsedTime(0); // Reinicia o cronômetro
        setTimerPaused(false); // Inicia o cronômetro
        Alert.alert("Sucesso", "Jornada de trabalho iniciada!");
      } else {
        Alert.alert("Erro", "Não foi possível iniciar a jornada.");
      }
    } catch (error) {
      console.error("Erro ao iniciar jornada:", error);
      Alert.alert("Erro", "Não foi possível iniciar a jornada.");
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
        setIsOnLunch(true);
        setTimerPaused(true); // Pausa o cronômetro
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
        setIsOnLunch(false);
        setTimerPaused(false); // Retoma o cronômetro
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
        setIsWorking(false);
        setIsOnLunch(false);
        setTimerPaused(true); // Pausa o cronômetro ao finalizar
        setElapsedTime(0); // Reseta o cronômetro
        await AsyncStorage.removeItem("recordId");

        // Salva a data atual como última jornada
        const today = new Date().toISOString().split("T")[0];
        await AsyncStorage.setItem("lastWorkDate", today);
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
      await AsyncStorage.clear();
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

      {!isWorking ? (
        <TouchableOpacity style={styles.button} onPress={startWorkDay}>
          <Text style={styles.buttonText}>Iniciar Jornada</Text>
        </TouchableOpacity>
      ) : isOnLunch ? (
        <TouchableOpacity style={styles.button} onPress={returnFromLunch}>
          <Text style={styles.buttonText}>Retornar do Almoço</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={startLunch}>
          <Text style={styles.buttonText}>Saída para Almoço</Text>
        </TouchableOpacity>
      )}

      {isWorking && !isOnLunch && (
        <TouchableOpacity
          style={styles.buttonFinalizar}
          onPress={finishWorkDay}
        >
          <Text style={styles.buttonText}>Finalizar Jornada</Text>
        </TouchableOpacity>
      )}

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => Alert.alert("Menu", "Menu aberto!")}
        >
          <Icon name="menu" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={logout}>
          <Icon name="logout" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
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
  button: {
    backgroundColor: "#E8B931",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    marginTop: 20,
  },
  buttonFinalizar: {
    backgroundColor: "#ec0101",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
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
});
