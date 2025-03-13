import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MenuComponent from "@/components/Menu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "@/services/api";
import dayjs from "dayjs";
import "dayjs/locale/pt-br"; // Importa o idioma português

dayjs.locale("pt-br"); // Define o idioma globalmente

export default function MonthFilter() {
  const [userName, setUserName] = useState<string | null>(null);
  const [monthStart, setMonthStart] = useState(dayjs().startOf("month")); // Primeiro dia do mês
  const [totalPositiveHours, setTotalPositiveHours] = useState("00h 00m");
  const [totalNegativeHours, setTotalNegativeHours] = useState("00h 00m");
  const [finalBalance, setFinalBalance] = useState("00h 00m");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const monthEnd = monthStart.endOf("month"); // Último dia do mês

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
  }, [monthStart]);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecords([]);

    try {
      const startDate = monthStart.format("YYYY-MM-DD");
      const endDate = monthEnd.format("YYYY-MM-DD");
      const apiUrl = `/time-records?startDate=${startDate}&endDate=${endDate}`;

      console.log("📅 Buscando registros para:", startDate, "até", endDate);
      console.log("🌐 URL da API:", apiUrl);

      const response = await api.get(apiUrl);

      console.log("✅ Resposta da API:", response.data);

      if (!response.data || !response.data.dailyResults) {
        setErrorMessage("Nenhum registro encontrado para esse mês.");
        setLoading(false);
        return;
      }

      // 🔹 Atualiza os registros diários do mês
      setRecords(response.data.dailyResults);

      // 🔹 Atualiza os valores de horas mensais
      if (response.data.monthlyResult) {
        setTotalPositiveHours(
          response.data.monthlyResult.totalPositiveHours || "00h 00m"
        );
        setTotalNegativeHours(
          response.data.monthlyResult.totalNegativeHours || "00h 00m"
        );
        setFinalBalance(response.data.monthlyResult.finalBalance || "00h 00m");
      }
    } catch (error: any) {
      console.log("❌ Código de erro:", error.response?.status);
      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado para esse mês.");
      } else {
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setLoading(false);
  };

  const changeMonth = (direction: "next" | "prev") => {
    const today = dayjs().startOf("day");
    const nextMonthStart = monthStart.add(1, "month").startOf("month");

    if (direction === "next" && nextMonthStart.isAfter(today)) {
      return;
    }

    setMonthStart(
      monthStart.add(direction === "next" ? 1 : -1, "month").startOf("month")
    );
  };

  const formatTime = (dateString: string | null) => {
    return dateString ? dayjs(dateString).format("HH:mm") : "--:--";
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, {userName ? userName : "Usuário"}</Text>

      {/* Navegação de Semana */}
      <View style={styles.dateBox}>
        <TouchableOpacity onPress={() => changeMonth("prev")}>
          <Icon name="chevron-left" size={50} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.dateText}>
          {dayjs(monthStart)
            .locale("pt-br")
            .format("MMMM [de] YYYY")
            .replace(/^(\w)/, (c) => c.toUpperCase())}
        </Text>

        <TouchableOpacity
          onPress={() => changeMonth("next")}
          disabled={monthStart.add(1, "month").isAfter(dayjs().startOf("day"))}
        >
          <Icon
            name="chevron-right"
            size={50}
            color={
              monthStart.add(1, "month").isAfter(dayjs().startOf("day"))
                ? "#888"
                : "#fff"
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Horas Positivas</Text>
          <Text style={styles.summaryValue}>{totalPositiveHours}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Horas Negativas</Text>
          <Text style={styles.summaryValue}>{totalNegativeHours}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Saldo Final</Text>
          <Text
            style={[
              styles.summaryValue,
              finalBalance.includes("-") ? styles.negative : styles.positive,
            ]}
          >
            {finalBalance}
          </Text>
        </View>
      </View>
      <View style={styles.border} />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {records.map((record, index) => (
              <View key={index} style={styles.containerReport}>
                <Text style={styles.weekDay}>
                  {weekDays[dayjs(record.date).day()]} - {record.date}
                </Text>

                <View style={styles.containerTime}>
                  <View style={styles.boxTime}>
                    <View style={styles.timeRecord}>
                      <Icon name="arrow-forward" size={30} color="#00ff15" />
                      <Text style={styles.timeText}>
                        {formatTime(record.clockIn)}
                      </Text>
                    </View>

                    <View style={styles.timeRecord}>
                      <Icon name="arrow-back" size={30} color="#ff0000" />
                      <Text style={styles.timeText}>
                        {formatTime(record.lunchStart)}
                      </Text>
                    </View>

                    <View style={styles.timeRecord}>
                      <Icon name="arrow-forward" size={30} color="#00ff15" />
                      <Text style={styles.timeText}>
                        {formatTime(record.lunchEnd)}
                      </Text>
                    </View>

                    <View style={styles.timeRecord}>
                      <Icon name="arrow-back" size={30} color="#ff0000" />
                      <Text style={styles.timeText}>
                        {formatTime(record.clockOut)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.containerSum}>
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryTitle}>Horas no dia</Text>
                      <Text style={styles.summaryValue}>
                        {record?.workedHours || "00:00"}
                      </Text>
                    </View>
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryTitle}>Saldo do dia</Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          record?.balance?.includes("-")
                            ? styles.negative
                            : styles.positive,
                        ]}
                      >
                        {record?.balance || "00:00"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 80,
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
  },
  dateText: {
    color: "#fff",
    fontSize: 18,
    marginHorizontal: 10,
  },
  border: {
    width: "100%",
    borderBottomColor: "#fff",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  content: {
    flex: 1, // Faz com que o ScrollView ocupe todo o espaço disponível
    width: "90%",
  },
  scrollView: {
    flexGrow: 1,
  },
  containerReport: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    borderColor: "#fff",
    marginBottom: 10,
  },
  weekDay: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  containerTime: {
    flexDirection: "column",
    justifyContent: "space-around",
    marginTop: 10,
  },
  boxTime: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  timeRecord: {
    alignItems: "center",
  },
  timeText: {
    color: "#fff",
    fontSize: 16,
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
    color: "#ff4444",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#011D4C",
    width: "90%",
    alignItems: "center",
    flexDirection: "row",
  },
  positive: {
    color: "#00ff15", // Verde para saldo positivo
    fontSize: 18,
    fontWeight: "bold",
  },
  negative: {
    color: "#ff0000", // Vermelho para saldo negativo
    fontSize: 18,
    fontWeight: "bold",
  },
});
