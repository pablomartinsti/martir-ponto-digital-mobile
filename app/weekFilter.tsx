import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MenuComponent from "@/components/Menu";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "@/services/api";
import dayjs from "dayjs";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/contexts/authContext";

export default function WeekFilter() {
  const { user } = useAuth();
  const userName = user?.name
    ? user.name.split(" ")[0].charAt(0).toUpperCase() +
      user.name.split(" ")[0].slice(1)
    : "Usuário";
  const [weekStart, setWeekStart] = useState(dayjs().day(0)); // Domingo
  const [weekEnd, setWeekEnd] = useState(dayjs().day(6)); // Sábado
  const [totalPositiveHours, setTotalPositiveHours] = useState("00h 00m");
  const [totalNegativeHours, setTotalNegativeHours] = useState("00h 00m");
  const [finalBalance, setFinalBalance] = useState("00h 00m");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRecords();
  }, [weekStart]);

  const changeWeek = (direction: "next" | "prev") => {
    if (loading) return;
    setLoading(true);

    const today = dayjs().startOf("day"); // Data de hoje sem horário
    const nextWeekStart = weekStart.add(7, "day").day(0); // Próximo domingo

    // Bloqueia avanço para semanas futuras
    if (direction === "next" && nextWeekStart.isAfter(today)) {
      setLoading(false);
      return;
    }

    const newWeekStart = weekStart
      .add(direction === "next" ? 7 : -7, "day")
      .day(0); // Sempre domingo
    setWeekStart(newWeekStart);
    setWeekEnd(newWeekStart.day(6)); // Sempre sábado
  };

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecords([]);

    try {
      const startDate = weekStart.format("YYYY-MM-DD");
      const endDate = weekEnd.format("YYYY-MM-DD");
      const apiUrl = `/time-records?period=week&startDate=${startDate}&endDate=${endDate}`;

      const response = await api.get(apiUrl);

      if (
        !response.data ||
        !response.data.results ||
        response.data.results.length === 0
      ) {
        setErrorMessage("Nenhum registro encontrado para essa semana.");
      } else {
        const allRecords = response.data.results.flatMap((r: any) => r.records);

        // 🔹 Ordena os registros para garantir que Domingo (0) seja o primeiro e Sábado (6) o último
        const sortedRecords = allRecords.sort(
          (a: { clockIn: string | null }, b: { clockIn: string | null }) => {
            const dayA = a.clockIn ? dayjs(a.clockIn).day() : 0;
            const dayB = b.clockIn ? dayjs(b.clockIn).day() : 0;
            return dayA - dayB;
          }
        );

        setRecords(sortedRecords);
        setTotalPositiveHours(response.data.totalPositiveHours || "00h 00m");
        setTotalNegativeHours(response.data.totalNegativeHours || "00h 00m");
        setFinalBalance(response.data.finalBalance || "00h 00m");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado para essa semana.");
      } else {
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setLoading(false);
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
        <TouchableOpacity onPress={() => changeWeek("prev")} disabled={loading}>
          <Icon
            name="chevron-left"
            size={50}
            color={loading ? "#888" : "#fff"}
          />
        </TouchableOpacity>

        <Text style={globalStyles.textFilter}>
          {weekStart.format("DD/MM/YYYY")} - {weekEnd.format("DD/MM/YYYY")}
        </Text>

        <TouchableOpacity
          onPress={() => changeWeek("next")}
          disabled={weekStart
            .add(7, "day")
            .day(0)
            .isAfter(dayjs().startOf("day"))}
        >
          <Icon
            name="chevron-right"
            size={50}
            color={
              loading ||
              weekStart.add(7, "day").day(0).isAfter(dayjs().startOf("day"))
                ? "#888"
                : "#fff"
            }
          />
        </TouchableOpacity>
      </View>
      <View style={globalStyles.containerBankHours}>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.bankHoursText}>Horas</Text>
          <Text style={globalStyles.bankHoursValue}>+{totalPositiveHours}</Text>
        </View>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.bankHoursText}>Horas</Text>
          <Text style={globalStyles.bankHoursValue}>-{totalNegativeHours}</Text>
        </View>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.bankHoursText}>Saldo</Text>
          <Text style={globalStyles.bankHoursValue}>{finalBalance}</Text>
        </View>
      </View>

      <View style={globalStyles.border} />

      <View style={globalStyles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : errorMessage ? (
          <Text style={globalStyles.errorText}>{errorMessage}</Text>
        ) : (
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
            ))}
          </ScrollView>
        )}
      </View>

      <MenuComponent />
    </View>
  );
}
