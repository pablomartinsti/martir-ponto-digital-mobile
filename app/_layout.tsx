import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/authContext';
import { useFonts } from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...MaterialIcons.font
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false
        }}
      />
    </AuthProvider>
  );
}
