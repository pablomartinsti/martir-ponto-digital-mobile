import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import dayjs from "dayjs";
import MenuComponent from "@/components/Menu";
import api from "@/services/api";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/contexts/authContext";
import { getWeekdayAndDate, formatDateUTCMinus3 } from "@/utils/workUtils";

export default function MonthFilter() {
  const { user, token } = useAuth();

  const userName = user?.name
    ? user.name.split(" ")[0].charAt(0).toUpperCase() +
      user.name.split(" ")[0].slice(1)
    : "Usuário";

  // Usando as funções de utils para definir o início e fim do mês
  const [monthStart, setMonthStart] = useState(() =>
    dayjs().startOf("month").set("hour", 0).set("minute", 0).set("second", 0)
  );
  const [monthEnd, setMonthEnd] = useState(() =>
    dayjs().endOf("month").set("hour", 23).set("minute", 59).set("second", 59)
  );
  const [totalPositiveHours, setTotalPositiveHours] = useState("00h 00m");
  const [totalNegativeHours, setTotalNegativeHours] = useState("00h 00m");
  const [finalBalance, setFinalBalance] = useState("00h 00m");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRecords();
  }, [monthStart]);

  const changeMonth = (direction: "next" | "prev") => {
    if (loading) return;
    setLoading(true);

    const newMonthStart = monthStart.add(
      direction === "next" ? 1 : -1,
      "month"
    );
    const newMonthEnd = newMonthStart.endOf("month");

    setMonthStart(newMonthStart);
    setMonthEnd(newMonthEnd);
  };

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecords([]);

    try {
      // Usando a função formatDateUTCMinus3
      const startDate = formatDateUTCMinus3(monthStart.toDate());
      const endDate = formatDateUTCMinus3(monthEnd.toDate());

      console.log("📦 Buscando registros do mês:");
      console.log("Start Date (UTC-3):", startDate);
      console.log("End Date (UTC-3):", endDate);

      const response = await api.get(
        `/time-records?period=month&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Resposta da API:", response.data);

      if (
        !response.data ||
        !response.data.results ||
        response.data.results.length === 0
      ) {
        setErrorMessage("Nenhum registro encontrado para esse mês.");
      } else {
        const allRecords = response.data.results.flatMap((r: any) => r.records);
        console.log("📊 Registros recebidos:", allRecords);

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
      console.log("❌ Erro na requisição:", error);
      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado para esse mês.");
      } else {
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setLoading(false);
  };

  const formatTime = (dateString: string | null) => {
    return dateString ? dayjs(dateString).format("HH:mm") : "--:--";
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Olá, {userName}</Text>

      <View style={globalStyles.containerFilter}>
        <TouchableOpacity
          onPress={() => changeMonth("prev")}
          disabled={loading}
        >
          <Icon
            name="chevron-left"
            size={50}
            color={loading ? "#888" : "#fff"}
          />
        </TouchableOpacity>

        <Text style={globalStyles.textFilter}>
          {monthStart.format("DD/MM/YYYY")} - {monthEnd.format("DD/MM/YYYY")}
        </Text>

        <TouchableOpacity
          onPress={() => changeMonth("next")}
          disabled={monthStart.add(1, "month").isAfter(dayjs().startOf("day"))}
        >
          <Icon
            name="chevron-right"
            size={50}
            color={
              loading ||
              monthStart.add(1, "month").isAfter(dayjs().startOf("day"))
                ? "#888"
                : "#fff"
            }
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
        ) : (
          <ScrollView
            style={globalStyles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {records.map((record, index) => (
              <View key={index} style={globalStyles.containerReport}>
                <Text style={globalStyles.weekDay}>
                  {record?.clockIn
                    ? getWeekdayAndDate(record.clockIn)
                    : "Dia não registrado"}
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
