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

export default function WeekFilter() {
  const [userName, setUserName] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(dayjs().startOf("week")); // Agora começa no domingo
  const [weekEnd, setWeekEnd] = useState(weekStart.add(6, "day")); // Sempre termina no sábado

  const [records, setRecords] = useState<any[]>([]);
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
  }, [weekStart]);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecords([]);

    try {
      const startDate = weekStart.format("YYYY-MM-DD");
      const endDate = weekEnd.format("YYYY-MM-DD");
      const apiUrl = `/time-records?period=week&startDate=${startDate}&endDate=${endDate}`;

      console.log("📅 Buscando registros para:", startDate, "até", endDate);
      console.log("🌐 URL da API:", apiUrl);

      const response = await api.get(apiUrl);

      console.log("✅ Resposta da API:", response.data);

      if (
        !response.data ||
        !response.data.results ||
        response.data.results.length === 0
      ) {
        setErrorMessage("Nenhum registro encontrado para essa semana.");
      } else {
        setRecords(response.data.results[0].records || []);
      }
    } catch (error: any) {
      console.log("❌ Código de erro:", error.response?.status);
      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado para essa semana.");
      } else {
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setLoading(false);
  };

  const changeWeek = (direction: "next" | "prev") => {
    const today = dayjs().startOf("day"); // Pega a data de hoje sem horário
    const nextWeekStart = weekStart.add(7, "day").startOf("week"); // Próximo domingo

    // Permite voltar para semanas passadas, mas bloqueia semanas futuras
    if (direction === "next" && nextWeekStart.isAfter(today)) {
      return; // Bloqueia avanço para semanas futuras
    }

    const newWeekStart = weekStart
      .add(direction === "next" ? 7 : -7, "day")
      .startOf("week"); // Sempre domingo
    setWeekStart(newWeekStart);
    setWeekEnd(newWeekStart.add(6, "day")); // Sempre termina no sábado
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
        <TouchableOpacity onPress={() => changeWeek("prev")}>
          <Icon name="chevron-left" size={50} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.dateText}>
          {weekStart.format("DD/MM/YYYY")} - {weekEnd.format("DD/MM/YYYY")}
        </Text>

        <TouchableOpacity
          onPress={() => changeWeek("next")}
          disabled={weekStart
            .add(7, "day")
            .startOf("week")
            .isAfter(dayjs().startOf("day"))} // Bloqueia futuras
        >
          <Icon
            name="chevron-right"
            size={50}
            color={
              weekStart
                .add(7, "day")
                .startOf("week")
                .isAfter(dayjs().startOf("day"))
                ? "#888"
                : "#fff"
            }
          />
        </TouchableOpacity>
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
                  {weekDays[dayjs(record.clockIn).day()]} -{" "}
                  {dayjs(record.clockIn).format("DD/MM/YYYY")}
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
                  <View style={styles.containerBankHours}>
                    <View style={styles.bankHoursBox}>
                      <Text style={styles.bankHoursTitle}>Horas no dia</Text>
                      <Text style={styles.bankHoursValue}>
                        {record?.workedHours || "00:00"}
                      </Text>
                    </View>
                    <View style={styles.bankHoursBox}>
                      <Text style={styles.bankHoursTitle}>Saldo do dia</Text>
                      <Text
                        style={[
                          styles.bankHoursValue,
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
    marginBottom: 20,
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
  containerBankHours: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  bankHoursBox: {
    alignItems: "center",
    padding: 5,
    borderRadius: 8,
  },
  bankHoursTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  bankHoursValue: {
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
  positive: {
    color: "#00ff15", // Verde para saldo positivo
  },
  negative: {
    color: "#ff0000", // Vermelho para saldo negativo
  },
});
