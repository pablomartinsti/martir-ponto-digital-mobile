import axios from "axios";
import { router } from "expo-router";
import { env } from "@/config/env";
import { getStoredUserData, setLogoutReason, clearStoredUserData } from "@/services/storageService";

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const storedUserData = await getStoredUserData();

    if (storedUserData?.token) {
      config.headers.Authorization = `Bearer ${storedUserData.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await setLogoutReason("expired");
      await clearStoredUserData();
      router.replace("/login");
    }

    return Promise.reject(error);
  }
);

export default api;
