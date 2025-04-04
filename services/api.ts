import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://localhost:3000/", // Substitua pelo endereço correto
  timeout: 2000,
});

// Intercepta as requisições para adicionar o token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token"); // Recupera o token do AsyncStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Inclui o token no cabeçalho
    }
    return config;
  },
  (error) => {
    console.error("Erro ao configurar a requisição:", error);
    return Promise.reject(error);
  }
);

export default api;
