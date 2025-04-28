import React from "react";
import { View, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { formatTime, weekDays } from "@/utils/dateUtils";
import globalStyles from "@/styles/globalStyles";
import dayjs from "dayjs";

interface PointRecordProps {
  record: any;
}

export default function PointRecord({ record }: PointRecordProps) {
  if (
    !record?.date ||
    record?.status === "Folga" ||
    (!record.clockIn &&
      !record.clockOut &&
      !record.lunchStart &&
      !record.lunchEnd)
  ) {
    return null;
  }

  return (
    <View style={globalStyles.containerReport}>
      <Text style={globalStyles.weekDay}>
        {weekDays[dayjs(record.date).day()]} -{" "}
        {dayjs(record.date).format("DD/MM/YYYY")}
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
  );
}
