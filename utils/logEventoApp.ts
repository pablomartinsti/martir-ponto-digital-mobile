import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import * as Device from "expo-device";

export async function logEventoApp({
  route,
  method,
  action,
  status,
  message,
}: {
  route: string;
  method: string;
  action: string;
  status: string;
  message: string;
}) {
  try {
    // 👇 Busca userData localmente
    const storedUserData = await AsyncStorage.getItem("userData");
    const parsedUser = storedUserData ? JSON.parse(storedUserData) : null;

    const userId = parsedUser?.id ?? null;
    const userName = parsedUser?.name ?? null;
    const companyId = parsedUser?.companyId ?? null;
    const companyName = parsedUser?.companyName ?? null;

    // 👇 Pega nome do aparelho
    const deviceName = Device.modelName || "Dispositivo desconhecido";

    // 👇 Envia o log para a API

    await api.post("/log-event", {
      userId,
      userName,
      companyId,
      companyName,
      route,
      method,
      action,
      status,
      message,
      device: deviceName,
    });
  } catch (error) {
    console.error("❌ Erro ao enviar log:", error);
  }
}
