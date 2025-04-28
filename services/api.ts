import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { logEventoApp } from "../utils/logEventoApp"; // 👉 importa aqui

const api = axios.create({
  baseURL: "http://192.168.100.94:3001",
  timeout: 2000,
});

// ✅ Interceptor de resposta para capturar token expirado + enviar logs de erro
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const route = config?.url || "rota-desconhecida";
    const method = config?.method?.toUpperCase() || "UNKNOWN";

    // 🚫 Não logar se o erro for da própria tentativa de log
    if (!route.includes("/event-logs")) {
      try {
        const isNetworkError = error.message === "Network Error";

        await logEventoApp({
          route,
          method,
          action: "Erro em requisição",
          status: isNetworkError ? "network-error" : "api-error",
          message:
            error.response?.data?.error || error.message || "Erro desconhecido",
        });
      } catch (logError) {
        console.error("Erro ao tentar enviar log automático:", logError);
      }
    } else {
      console.warn("⛔ Erro na própria rota /event-logs, log ignorado.");
    }

    // 🔒 Token expirado → Força logout
    if (error.response?.status === 401) {
      console.warn(
        "🔒 Token expirado ou inválido. Executando logout automático..."
      );
      await AsyncStorage.setItem("logoutReason", "expired");
      await AsyncStorage.removeItem("userData");
      router.replace("/login");
    }

    return Promise.reject(error);
  }
);

// ✅ Interceptor para adicionar o token nas requisições
api.interceptors.request.use(
  async (config) => {
    try {
      const storedUserData = await AsyncStorage.getItem("userData");
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        const token = parsed.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("❌ Erro ao recuperar o token:", error);
    }
    return config;
  },
  (error) => {
    console.error("Erro ao configurar a requisição:", error);
    return Promise.reject(error);
  }
);

export default api;
