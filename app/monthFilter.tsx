import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MenuComponent from "@/components/Menu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "@/services/api";
import globalStyles from "@/styles/globalStyles";
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

  const changeMonth = (direction: "next" | "prev") => {
    if (loading) return; // Bloqueia mudança enquanto estiver carregando

    const today = dayjs().startOf("day");
    const nextMonthStart = monthStart.add(1, "month").startOf("month");

    if (direction === "next" && nextMonthStart.isAfter(today)) {
      return;
    }

    setLoading(true); // 🔹 Agora o estado de `loading` é atualizado antes de mudar o mês

    const newMonth = monthStart
      .add(direction === "next" ? 1 : -1, "month")
      .startOf("month");

    setMonthStart(newMonth);
  };

  // 🚀 Garante que `fetchRecords` será chamado ao mudar o mês
  useEffect(() => {
    fetchRecords();
  }, [monthStart]);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecords([]); // 🔹 Limpa os registros antes de buscar novos

    try {
      const startDate = monthStart.format("YYYY-MM-DD");
      const endDate = monthEnd.format("YYYY-MM-DD");
      const apiUrl = `/time-records?period=month&startDate=${startDate}&endDate=${endDate}`;

      const response = await api.get(apiUrl);

      if (!response.data || !response.data.results.length) {
        setErrorMessage("Nenhum registro encontrado para esse mês.");
        setLoading(false);
        return;
      }

      // 🔹 Definição do tipo de registro
      type RecordType = {
        _id: string;
        clockIn: string;
        lunchStart?: string;
        lunchEnd?: string;
        clockOut?: string;
        location?: { latitude: number; longitude: number };
        workedHours: string;
        balance: string;
      };

      type ResultType = {
        _id: { month: number; year: number };
        records: RecordType[];
      };

      // 🔹 Obtém todos os registros de todos os grupos com tipagem correta
      const allRecords: RecordType[] = response.data.results.flatMap(
        (result: ResultType) => result.records
      );

      if (!allRecords.length) {
        setErrorMessage("Nenhum registro encontrado para esse mês.");
        setLoading(false);
        return;
      }

      // 🔹 Filtra apenas registros do mês selecionado
      const filteredRecords = allRecords.filter((record: RecordType) => {
        const recordDate = dayjs(record.clockIn);
        return recordDate.isSame(monthStart, "month"); // Agora considera apenas o mês certo
      });

      // 🔹 Ordena os registros por data de entrada (clockIn)
      const sortedRecords = filteredRecords.sort(
        (a: RecordType, b: RecordType) =>
          dayjs(a.clockIn).isBefore(dayjs(b.clockIn)) ? -1 : 1
      );

      setRecords(sortedRecords);

      // 🔹 Atualiza os valores de horas mensais
      setTotalPositiveHours(response.data.totalPositiveHours || "00h 00m");
      setTotalNegativeHours(response.data.totalNegativeHours || "00h 00m");
      setFinalBalance(response.data.finalBalance || "00h 00m");
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado para esse mês.");
      } else {
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const formatTime = (dateString: string | null) => {
    return dateString ? dayjs(dateString).format("HH:mm") : "--:--";
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>
        Olá, {userName ? userName : "Usuário"}
      </Text>

      {/* Navegação de Semana */}
      <View style={globalStyles.containerFilter}>
        <TouchableOpacity
          onPress={() => changeMonth("prev")}
          disabled={loading} // 🔹 Bloqueia enquanto carrega
        >
          <Icon
            name="chevron-left"
            size={50}
            color={loading ? "#888" : "#fff"} // 🔹 Ícone muda de cor para indicar bloqueio
          />
        </TouchableOpacity>

        <Text style={globalStyles.textFilter}>
          {dayjs(monthStart)
            .locale("pt-br")
            .format("MMMM [de] YYYY")
            .replace(/^(\w)/, (c) => c.toUpperCase())}
        </Text>

        <TouchableOpacity
          onPress={() => changeMonth("next")}
          disabled={
            loading ||
            monthStart.add(1, "month").isAfter(dayjs().startOf("day"))
          }
        >
          <Icon
            name="chevron-right"
            size={50}
            color={loading ? "#888" : "#fff"} // 🔹 Ícone cinza quando desativado
          />
        </TouchableOpacity>
      </View>

      <View style={globalStyles.containerBankHours}>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.workedText}>Horas</Text>
          <Text style={globalStyles.bankHoursValue}>+{totalPositiveHours}</Text>
        </View>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.workedText}>Horas</Text>
          <Text style={globalStyles.bankHoursValue}>-{totalNegativeHours}</Text>
        </View>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.workedText}>Saldo</Text>
          <Text
            style={[
              globalStyles.bankHoursValue,
              finalBalance.includes("-")
                ? globalStyles.negative
                : globalStyles.positive,
            ]}
          >
            {finalBalance}
          </Text>
        </View>
      </View>
      <View style={globalStyles.border} />

      <View style={globalStyles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : errorMessage ? (
          <Text style={globalStyles.errorText}>{errorMessage}</Text>
        ) : records.length > 0 ? (
          <ScrollView
            style={globalStyles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {records.map((record, index) => (
              <View key={index} style={globalStyles.containerReport}>
                <Text style={globalStyles.weekDay}>
                  {weekDays[dayjs(record.clockIn).day()]} -{" "}
                  {dayjs(record.clockIn).format("DD/MM/YYYY")}
                </Text>

                <View style={globalStyles.containerTime}>
                  <View style={globalStyles.boxTime}>
                    <View style={globalStyles.pointTime}>
                      <Icon name="arrow-forward" size={30} color="#00ff15" />
                      <Text style={globalStyles.timeText}>
                        {formatTime(record.clockIn)}
                      </Text>
                    </View>

                    <View style={globalStyles.pointTime}>
                      <Icon name="arrow-back" size={30} color="#ff0000" />
                      <Text style={globalStyles.timeText}>
                        {formatTime(record.lunchStart)}
                      </Text>
                    </View>

                    <View style={globalStyles.pointTime}>
                      <Icon name="arrow-forward" size={30} color="#00ff15" />
                      <Text style={globalStyles.timeText}>
                        {formatTime(record.lunchEnd)}
                      </Text>
                    </View>

                    <View style={globalStyles.pointTime}>
                      <Icon name="arrow-back" size={30} color="#ff0000" />
                      <Text style={globalStyles.timeText}>
                        {formatTime(record.clockOut)}
                      </Text>
                    </View>
                  </View>
                  <View style={globalStyles.containerWorked}>
                    <View style={globalStyles.boxWorked}>
                      <Text style={globalStyles.workedText}>Horas</Text>
                      <Text style={globalStyles.bankHoursValue}>
                        {record?.workedHours || "00:00"}
                      </Text>
                    </View>
                    <View style={globalStyles.boxWorked}>
                      <Text style={globalStyles.workedText}>Saldo</Text>
                      <Text
                        style={[
                          globalStyles.bankHoursValue,
                          record?.balance?.includes("-")
                            ? globalStyles.negative
                            : globalStyles.positive,
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
        ) : (
          <Text style={globalStyles.errorText}>
            Nenhum registro encontrado.
          </Text>
        )}
      </View>

      <MenuComponent />
    </View>
  );
}
