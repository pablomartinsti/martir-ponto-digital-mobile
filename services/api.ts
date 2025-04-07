import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://api.martircontabil.com.br",
  timeout: 2000,
});

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
