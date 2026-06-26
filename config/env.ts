import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

export const env = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ||
    extra?.apiUrl ||
    "https://api.martircontabil.com.br",
};
