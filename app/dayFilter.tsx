import React from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import MenuComponent from "@/components/Menu";
import Icon from "react-native-vector-icons/MaterialIcons";
import globalStyles from "@/styles/globalStyles";
import { useAuth } from "@/contexts/authContext";
import PointRecord from "@/components/PointRecord";
import { useTimeRecords } from "@/hooks/useTimeRecords";

export default function DayFilter() {
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
  } = useTimeRecords("day");

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Olá, {userName}</Text>

      {/* Navegação */}
      <View style={globalStyles.containerFilter}>
        <TouchableOpacity onPress={goToPrev}>
          <Icon name="chevron-left" size={30} color="#fff" />
        </TouchableOpacity>

        <Text style={globalStyles.textFilter}>{periodLabel}</Text>

        <TouchableOpacity onPress={goToNext} disabled={!canGoNext}>
          <Icon
            name="chevron-right"
            size={30}
            color={canGoNext ? "#fff" : "#777"}
          />
        </TouchableOpacity>
      </View>

      <View style={globalStyles.border} />

      <View style={globalStyles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : errorMessage ? (
          <Text style={globalStyles.errorText}>{errorMessage}</Text>
        ) : data && data.records && data.records.length > 0 ? (
          data.records[0].clockIn ? (
            <PointRecord record={data.records[0]} />
          ) : (
            <Text style={globalStyles.errorText}>
              Nenhum registro encontrado.
            </Text>
          )
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
