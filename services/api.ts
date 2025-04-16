import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const api = axios.create({
  baseURL: "http://192.168.100.94:3000",
  timeout: 2000,
});
// ✅ Interceptor de resposta para capturar token expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
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

// Interceptor para adicionar o token nas requisições
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
