import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import MenuComponent from "@/components/Menu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "@/services/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function DayFilter() {
  const [userName, setUserName] = useState<string | null>(null);
  const [date, setDate] = useState(
    () => new Date(dayjs().tz("America/Sao_Paulo").format("YYYY-MM-DD"))
  );
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedName = await AsyncStorage.getItem("employeeName");
        if (storedName) {
          setUserName(storedName);
        }
      } catch (error) {
        console.error("❌ Erro ao recuperar usuário:", error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [date]);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecord(null);

    try {
      const formattedDate = formatDate(date);
      const today = dayjs().tz("America/Sao_Paulo").format("YYYY-MM-DD"); // 🔹 Garante a data correta no fuso BR

      console.log("📅 Buscando registros para:", formattedDate);
      console.log("📆 Data de hoje:", today);

      if (formattedDate > today) {
        setErrorMessage("Não é possível visualizar registros futuros.");
        setLoading(false);
        return;
      }

      const apiUrl = `/time-records?startDate=${formattedDate}&endDate=${formattedDate}`;

      console.log("🌐 URL da API:", apiUrl);
      const response = await api.get(apiUrl);

      console.log("✅ Resposta da API:", response.data);

      if (
        !response.data ||
        !response.data.dailyResults ||
        response.data.dailyResults.length === 0
      ) {
        setErrorMessage("Nenhum registro encontrado.");
      } else {
        setRecord(response.data.dailyResults[0]);
      }
    } catch (error: any) {
      console.log("❌ Código de erro:", error.response?.status);

      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado.");
      } else {
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setLoading(false);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--"; // Se não houver horário, mostra "--:--"
    return dayjs(dateString).format("HH:mm");
  };

  const changeDate = (days: number) => {
    setDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Removendo a hora para comparar apenas a data

      if (newDate > today) {
        return prevDate; // 🔹 Impede de selecionar datas futuras
      }

      return newDate;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, {userName ? userName : "Usuário"}</Text>

      {/* Navegação de Data */}
      <View style={styles.dateBox}>
        <TouchableOpacity onPress={() => changeDate(-1)}>
          <Icon name="chevron-left" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
        <TouchableOpacity
          onPress={() => changeDate(1)}
          disabled={dayjs(date).add(1, "day").isAfter(dayjs().startOf("day"))} // 🔹 Bloqueia futuras
        >
          <Icon
            name="chevron-right"
            size={30}
            color={
              dayjs(date).add(1, "day").isAfter(dayjs().startOf("day"))
                ? "#777" // 🔹 Cor mais clara para indicar desabilitado
                : "#fff"
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.border} />

      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <View style={styles.containerReport}>
          <View style={styles.containerTime}>
            {/* Entrada */}
            <View style={styles.timeRecord}>
              <Icon name="arrow-forward" size={30} color="#00ff15" />
              <Text style={styles.timeText}>{formatTime(record?.clockIn)}</Text>
            </View>

            {/* Saída para almoço */}
            <View style={styles.timeRecord}>
              <Icon name="arrow-back" size={30} color="#ff0000" />
              <Text style={styles.timeText}>
                {formatTime(record?.lunchStart)}
              </Text>
            </View>

            {/* Retorno do almoço */}
            <View style={styles.timeRecord}>
              <Icon name="arrow-forward" size={30} color="#00ff15" />
              <Text style={styles.timeText}>
                {formatTime(record?.lunchEnd)}
              </Text>
            </View>

            {/* Saída final */}
            <View style={styles.timeRecord}>
              <Icon name="arrow-back" size={30} color="#ff0000" />
              <Text style={styles.timeText}>
                {formatTime(record?.clockOut)}
              </Text>
            </View>
          </View>

          {/* Informações de Horas Trabalhadas */}
          <View style={styles.containerSum}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Horas no dia</Text>
              <Text style={styles.summaryValue}>
                {record?.workedHours || "00:00"}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Saldo do dia</Text>
              <Text style={styles.summaryValue}>
                {record?.balance || "00:00"}
              </Text>
            </View>
          </View>
        </View>
      )}

      <MenuComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#011D4C",
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dateText: {
    color: "#fff",
    fontSize: 20,
    marginHorizontal: 10,
  },
  border: {
    width: "100%",
    borderBottomColor: "#fff",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  containerReport: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    borderColor: "#fff",
  },
  containerTime: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    marginTop: 20,
  },
  timeRecord: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  timeText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 5,
  },
  containerSum: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  summaryBox: {
    alignItems: "center",
    padding: 5,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});
