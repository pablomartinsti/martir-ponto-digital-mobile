import React from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import MenuComponent from "@/components/Menu";
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
    <SafeAreaView style={globalStyles.container} edges={["top", "left", "right"]}>
      <Text style={globalStyles.title}>Olá, {userName}</Text>

      <View style={globalStyles.containerFilter}>
        <TouchableOpacity onPress={goToPrev} disabled={loading} activeOpacity={0.75}>
          <MaterialIcons
            name="chevron-left"
            size={42}
            color={loading ? "#888" : "#fff"}
          />
        </TouchableOpacity>

        <Text style={globalStyles.textFilter}>{periodLabel}</Text>

        <TouchableOpacity
          onPress={goToNext}
          disabled={!canGoNext || loading}
          activeOpacity={0.75}
        >
          <MaterialIcons
            name="chevron-right"
            size={42}
            color={!canGoNext || loading ? "#777" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      <View style={globalStyles.border} />

      <ScrollView
        style={globalStyles.content}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : errorMessage ? (
          <Text style={globalStyles.errorText}>{errorMessage}</Text>
        ) : data?.records?.[0]?.clockIn ? (
          <PointRecord record={data.records[0]} />
        ) : (
          <Text style={globalStyles.errorText}>Nenhum registro encontrado.</Text>
        )}
      </ScrollView>

      <MenuComponent />
    </SafeAreaView>
  );
}
