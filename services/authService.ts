import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";

export async function loginToAPI(cpf: string, password: string) {
  try {
    const response = await api.post("/login", { cpf, password });

    if (response.data.token && response.data.user) {
      const { token, user } = response.data;

      if (user.role !== "employee") {
        throw new Error("Este app é exclusivo para funcionários.");
      }

      await AsyncStorage.setItem(
        "userData",
        JSON.stringify({ token, ...user })
      );

      return { token, user };
    } else {
      throw new Error("Credenciais inválidas.");
    }
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.error || "Erro ao fazer login.";

      switch (status) {
        case 401:
          throw new Error("Senha inválida. Tente novamente.");
        case 403:
          throw new Error(
            "Funcionário desativado. Entre em contato com o administrador."
          );
        case 404:
          throw new Error("Funcionário não encontrado. Verifique seu CPF.");
        default:
          throw new Error(errorMsg);
      }
    }

    throw new Error(
      "Erro ao conectar com o servidor. Tente novamente mais tarde."
    );
  }
}
