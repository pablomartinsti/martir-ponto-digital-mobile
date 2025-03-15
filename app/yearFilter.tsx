import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import MenuComponent from "@/components/Menu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "@/services/api";
import globalStyles from "@/styles/globalStyles";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

export default function YearFilter() {
  const [userName, setUserName] = useState<string | null>(null);
  const [yearStart, setYearStart] = useState(dayjs().startOf("year"));
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
  }, [yearStart]);

  const changeYear = (direction: "next" | "prev") => {
    if (loading) return;
    setLoading(true);

    const today = dayjs().startOf("year"); // Ano atual sem horário
    const nextYearStart = yearStart.add(1, "year").startOf("year"); // Próximo ano

    // Bloqueia avanço para anos futuros
    if (direction === "next" && nextYearStart.isAfter(today, "year")) {
      setLoading(false);
      return;
    }

    const newYear = yearStart
      .add(direction === "next" ? 1 : -1, "year")
      .startOf("year");
    setYearStart(newYear);
  };

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecords([]);

    try {
      const startDate = yearStart.format("YYYY-01-01");
      const endDate = yearStart.format("YYYY-12-31");
      const apiUrl = `/time-records?period=year&startDate=${startDate}&endDate=${endDate}`;

      const response = await api.get(apiUrl);

      if (!response.data || !response.data.results.length) {
        setErrorMessage("Nenhum registro encontrado para esse ano.");
        setLoading(false);
        return;
      }

      setRecords(response.data.results);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErrorMessage("Nenhum registro encontrado para esse ano.");
      } else {
        setErrorMessage("Erro ao carregar registros.");
      }
    }

    setLoading(false);
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>
        Olá, {userName ? userName : "Usuário"}
      </Text>

      <View style={globalStyles.containerFilter}>
        <TouchableOpacity onPress={() => changeYear("prev")} disabled={loading}>
          <Icon
            name="chevron-left"
            size={50}
            color={loading ? "#888" : "#fff"}
          />
        </TouchableOpacity>

        <Text style={globalStyles.textFilter}>{yearStart.format("YYYY")}</Text>

        <TouchableOpacity onPress={() => changeYear("next")} disabled={loading}>
          <Icon
            name="chevron-right"
            size={50}
            color={
              yearStart.add(1, "year").isAfter(dayjs().startOf("year"))
                ? "#888"
                : "#fff"
            }
          />
        </TouchableOpacity>
      </View>

      <View style={globalStyles.border} />
      <View style={globalStyles.content}>
        <ScrollView
          style={globalStyles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : errorMessage ? (
            <Text style={globalStyles.errorText}>{errorMessage}</Text>
          ) : (
            records.map((record, index) => (
              <View key={index} style={globalStyles.containerReport}>
                <Text style={globalStyles.weekDay}>
                  {dayjs()
                    .month(record._id.month - 1)
                    .format("MMMM")
                    .replace(/^./, (match) => match.toUpperCase())}{" "}
                </Text>

                <View style={globalStyles.containerWorked}>
                  <View style={globalStyles.view}>
                    <View style={globalStyles.boxWorked}>
                      <Text style={globalStyles.workedText}>
                        Horas Trabalhadas
                      </Text>
                      <Text style={globalStyles.bankHoursValue}>
                        {record.totalWorkedHours || "00:00"}
                      </Text>
                    </View>
                    <View style={globalStyles.boxWorked}>
                      <Text style={globalStyles.workedText}>Saldo</Text>
                      <Text
                        style={[
                          globalStyles.bankHoursValue,
                          record.finalBalance.includes("-")
                            ? globalStyles.negative
                            : globalStyles.positive,
                        ]}
                      >
                        {record.finalBalance || "00:00"}
                      </Text>
                    </View>
                  </View>
                  <View style={globalStyles.view}>
                    <View style={globalStyles.boxWorked}>
                      <Text style={globalStyles.workedText}>
                        Horas Positivas
                      </Text>
                      <Text style={globalStyles.bankHoursValue}>
                        {record.totalPositiveHours || "00:00"}
                      </Text>
                    </View>
                    <View style={globalStyles.boxWorked}>
                      <Text style={globalStyles.workedText}>
                        Horas Negativas
                      </Text>
                      <Text style={globalStyles.bankHoursValue}>
                        {record.totalNegativeHours || "00:00"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <MenuComponent />
    </View>
  );
}
