import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/authContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false, // Oculta o cabeçalho padrão
        }}
      />
    </AuthProvider>
  );
}
