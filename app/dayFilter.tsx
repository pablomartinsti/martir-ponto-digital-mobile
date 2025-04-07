import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import MenuComponent from "@/components/Menu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "@/services/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import globalStyles from "@/styles/globalStyles";

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

      if (formattedDate > today) {
        setErrorMessage("Não é possível visualizar registros futuros.");
        setLoading(false);
        return;
      }

      const apiUrl = `/time-records?period=day&startDate=${formattedDate}&endDate=${formattedDate}`;

      const response = await api.get(apiUrl);

      if (
        !response.data ||
        !response.data.results ||
        response.data.results.length === 0
      ) {
        setErrorMessage("Nenhum registro encontrado.");
      } else {
        setRecord(response.data.results[0].records[0] || null); // 🔹 Pega o primeiro registro válido do dia
      }
    } catch (error: any) {
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
      today.setHours(0, 0, 0, 0); // 🔹 Remove a hora para comparar apenas a data

      if (newDate > today) {
        return prevDate; // 🔹 Impede seleção de datas futuras
      }

      return newDate;
    });
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>
        Olá, {userName ? userName : "Usuário"}
      </Text>

      {/* Navegação de Data */}
      <View style={globalStyles.containerFilter}>
        <TouchableOpacity onPress={() => changeDate(-1)}>
          <Icon name="chevron-left" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={globalStyles.textFilter}>{formatDate(date)}</Text>
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

      <View style={globalStyles.border} />
      <View style={globalStyles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : errorMessage ? (
          <Text style={globalStyles.errorText}>{errorMessage}</Text>
        ) : (
          <View style={globalStyles.containerReport}>
            <Text style={globalStyles.weekDay}>
              {record?.clockIn
                ? `${weekDays[dayjs(record.clockIn).day()]} - ${dayjs(
                    record.clockIn
                  ).format("DD/MM/YYYY")}`
                : "Data não disponível"}
            </Text>

            <View style={globalStyles.containerTime}>
              {/* Entrada */}
              <View style={globalStyles.boxTime}>
                <View style={globalStyles.pointTime}>
                  <Icon name="arrow-forward" size={30} color="#00ff15" />
                  <Text style={globalStyles.timeText}>
                    {formatTime(record?.clockIn)}
                  </Text>
                </View>

                {/* Saída para almoço */}
                <View style={globalStyles.pointTime}>
                  <Icon name="arrow-back" size={30} color="#ff0000" />
                  <Text style={globalStyles.timeText}>
                    {formatTime(record?.lunchStart)}
                  </Text>
                </View>

                {/* Retorno do almoço */}
                <View style={globalStyles.pointTime}>
                  <Icon name="arrow-forward" size={30} color="#00ff15" />
                  <Text style={globalStyles.timeText}>
                    {formatTime(record?.lunchEnd)}
                  </Text>
                </View>

                {/* Saída final */}
                <View style={globalStyles.pointTime}>
                  <Icon name="arrow-back" size={30} color="#ff0000" />
                  <Text style={globalStyles.timeText}>
                    {formatTime(record?.clockOut)}
                  </Text>
                </View>
              </View>
              {/* Informações de Horas Trabalhadas */}
              <View style={globalStyles.containerWorked}>
                <View style={globalStyles.boxWorked}>
                  <Text style={globalStyles.workedText}>Horas</Text>
                  <Text style={globalStyles.workedValue}>
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
        )}
      </View>

      <MenuComponent />
    </View>
  );
}
