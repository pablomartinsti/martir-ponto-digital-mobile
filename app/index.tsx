import React from "react";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { getStoredUserData } from "@/services/storageService";
import { isTokenExpired } from "@/utils/auth";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      const userData = await getStoredUserData();

      if (userData?.token && !isTokenExpired(userData.token)) {
        router.replace("/welcome");
        return;
      }

      router.replace("/login");
    };

    checkAuthentication();
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#011D4C" }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
