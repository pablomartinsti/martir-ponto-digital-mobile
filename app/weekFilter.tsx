import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MenuComponent from "@/components/Menu";
import Icon from "react-native-vector-icons/MaterialIcons";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/contexts/authContext";
import PointRecord from "@/components/PointRecord";
import { useTimeRecords } from "@/hooks/useTimeRecords";

export default function WeekFilter() {
  const { user } = useAuth();
  const userName = user?.name
    ? user.name.split(" ")[0].charAt(0).toUpperCase() +
      user.name.split(" ")[0].slice(1)
    : "Usuário";

  const {
    data,
    loading,
    errorMessage,
    goToNext,
    goToPrev,
    periodLabel,
    canGoNext,
  } = useTimeRecords("week");

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Olá, {userName}</Text>

      {/* Navegação da semana */}
      <View style={globalStyles.containerFilter}>
        <TouchableOpacity onPress={goToPrev} disabled={loading}>
          <Icon
            name="chevron-left"
            size={50}
            color={loading ? "#888" : "#fff"}
          />
        </TouchableOpacity>

        <Text style={globalStyles.textFilter}>{periodLabel}</Text>

        <TouchableOpacity onPress={goToNext} disabled={!canGoNext || loading}>
          <Icon
            name="chevron-right"
            size={50}
            color={!canGoNext || loading ? "#888" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      <View style={globalStyles.containerBankHours}>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.bankHoursText}>Horas</Text>
          <Text style={globalStyles.bankHoursValue}>
            +{data?.totalPositiveHours || "00h 00m"}
          </Text>
        </View>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.bankHoursText}>Horas</Text>
          <Text style={globalStyles.bankHoursValue}>
            -{data?.totalNegativeHours || "00h 00m"}
          </Text>
        </View>
        <View style={globalStyles.boxBankHours}>
          <Text style={globalStyles.bankHoursText}>Saldo</Text>
          <Text
            style={[
              globalStyles.bankHoursValue,
              data?.finalBalance?.includes("-")
                ? globalStyles.negative
                : globalStyles.positive,
            ]}
          >
            {data?.finalBalance || "00h 00m"}
          </Text>
        </View>
      </View>

      <View style={globalStyles.border} />
      <ScrollView style={globalStyles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : errorMessage ? (
          <Text style={globalStyles.errorText}>{errorMessage}</Text>
        ) : data?.records?.length > 0 ? (
          data.records.map((record: any) => (
            <PointRecord key={record.date} record={record} />
          ))
        ) : (
          <Text style={globalStyles.errorText}>
            Nenhum registro encontrado.
          </Text>
        )}
      </ScrollView>

      <MenuComponent />
    </View>
  );
}
