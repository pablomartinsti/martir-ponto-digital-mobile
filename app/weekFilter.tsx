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
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/contexts/authContext";
import { getWeekdayAndDate, formatDateUTCMinus3 } from "../utils/workUtils";
import { fetchTimeRecords } from "@/utils/recordUtils";

export default function WeekFilter() {
  const { user, token } = useAuth();

  const userName = user?.name
    ? user.name.split(" ")[0].charAt(0).toUpperCase() +
      user.name.split(" ")[0].slice(1)
    : "Usuário";

  const [weekStart, setWeekStart] = useState(() =>
    dayjs().startOf("week").set("hour", 0).set("minute", 0).set("second", 0)
  );
  const [weekEnd, setWeekEnd] = useState(() =>
    dayjs().startOf("week").add(6, "day").endOf("day")
  );

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRecords();
  }, [weekStart]);

  const changeWeek = (direction: "next" | "prev") => {
    if (loading) return;
    setLoading(true);

    const today = dayjs().startOf("day");

    const newWeekStart = weekStart
      .add(direction === "next" ? 7 : -7, "day")
      .day(0);

    const newWeekEnd = newWeekStart.day(6);

    // ❌ Se nova semana termina depois de hoje, e é totalmente futura, bloqueia
    if (direction === "next" && newWeekStart.isAfter(today)) {
      setLoading(false);
      return;
    }

    setWeekStart(newWeekStart);
    setWeekEnd(newWeekEnd);
  };

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMessage("");
    setRecords([]);

    try {
      const startDate = formatDateUTCMinus3(weekStart.toDate());
      const endDate = formatDateUTCMinus3(weekEnd.toDate());

      const { records } = await fetchTimeRecords(
        token!,
        "week",
        startDate,
        endDate
      );

      if (records.length === 0) {
        setErrorMessage("Nenhum registro encontrado para essa semana.");
      } else {
        const sortedRecords = records.sort((a, b) => {
          const dayA = a.clockIn ? dayjs(a.clockIn).day() : 0;
          const dayB = b.clockIn ? dayjs(b.clockIn).day() : 0;
          return dayA - dayB;
        });

        setRecords(sortedRecords);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao carregar registros.");
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
