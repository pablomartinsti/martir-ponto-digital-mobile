import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import dayjs from "dayjs";
import globalStyles from "@/styles/globalStyles";
import MenuComponent from "@/components/Menu";
import api from "@/services/api";
import { useAuth } from "@/contexts/authContext";
import {
  formatDateToISO,
  formatTimeOrPlaceholder,
} from "@/utils/dateTimeUtils";
import { getWeekdayAndDate } from "@/utils/workUtils";

export default function DayFilter() {
  const { user, token } = useAuth();

  const userName = user?.name
    ? user.name.split(" ")[0].charAt(0).toUpperCase() +
      user.name.split(" ")[0].slice(1)
    : "Usuário";

  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera hora, minuto, segundo, milissegundo
    return today;
  });

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRecords();
  }, [date]);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecord(null);

    try {
      const formattedDate = formatDateToISO(date);

      const today = dayjs().format("YYYY-MM-DD");

      if (formattedDate > today) {
        setErrorMessage("Não é possível visualizar registros futuros.");
        setLoading(false);
        return;
      }

      const apiUrl = `/time-records?period=day&startDate=${formattedDate}&endDate=${formattedDate}`;
      const response = await api.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`, // <-- se for necessário
        },
      });

      const data = response.data;

      const record =
        data?.results?.[0]?.records?.length > 0
          ? data.results[0].records[0]
          : null;

      if (record) {
        setRecord(record);
      } else {
        setErrorMessage("Nenhum registro encontrado.");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado.");
      } else {
        console.error("Erro ao buscar registros:", error);
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setLoading(false);
  };

  const changeDate = (days: number) => {
    setDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (newDate > today) {
        return prevDate;
      }

      return newDate;
    });
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Olá, {userName}</Text>

      {/* Navegação de Data */}
      <View style={globalStyles.containerFilter}>
        <TouchableOpacity onPress={() => changeDate(-1)}>
          <Icon name="chevron-left" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={globalStyles.textFilter}>{formatDateToISO(date)}</Text>
        <TouchableOpacity
          onPress={() => changeDate(1)}
          disabled={dayjs(date).add(1, "day").isAfter(dayjs().startOf("day"))}
        >
          <Icon
            name="chevron-right"
            size={30}
            color={
              dayjs(date).add(1, "day").isAfter(dayjs().startOf("day"))
                ? "#777"
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
                ? getWeekdayAndDate(record.clockIn)
                : "Data não disponível"}
            </Text>

            <View style={globalStyles.containerTime}>
              {/* Entrada */}
              <View style={globalStyles.boxTime}>
                <View style={globalStyles.pointTime}>
                  <Icon name="arrow-forward" size={30} color="#00ff15" />
                  <Text style={globalStyles.timeText}>
                    {formatTimeOrPlaceholder(record?.clockIn)}
                  </Text>
                </View>

                {/* Saída para almoço */}
                <View style={globalStyles.pointTime}>
                  <Icon name="arrow-back" size={30} color="#ff0000" />
                  <Text style={globalStyles.timeText}>
                    {formatTimeOrPlaceholder(record?.lunchStart)}
                  </Text>
                </View>

                {/* Retorno do almoço */}
                <View style={globalStyles.pointTime}>
                  <Icon name="arrow-forward" size={30} color="#00ff15" />
                  <Text style={globalStyles.timeText}>
                    {formatTimeOrPlaceholder(record?.lunchEnd)}
                  </Text>
                </View>

                {/* Saída final */}
                <View style={globalStyles.pointTime}>
                  <Icon name="arrow-back" size={30} color="#ff0000" />
                  <Text style={globalStyles.timeText}>
                    {formatTimeOrPlaceholder(record?.clockOut)}
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
