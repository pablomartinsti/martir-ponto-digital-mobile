import api from "@/services/api";
import { setStoredUserData } from "@/services/storageService";
import { AuthUser } from "@/types/auth";

type LoginResponse = {
  token?: string;
  user?: AuthUser;
};

function getApiErrorMessage(error: any) {
  if (!error.response) {
    return "Erro ao conectar com o servidor. Verifique sua internet e tente novamente.";
  }

  const status = error.response.status;
  const errorMsg = error.response.data?.error || "Erro ao fazer login.";

  if (status === 401) return "Senha inválida. Tente novamente.";
  if (status === 403) return "Funcionário desativado ou sem permissão. Entre em contato com o administrador.";
  if (status === 404) return "Funcionário não encontrado. Verifique seu CPF.";

  return errorMsg;
}

export async function loginToAPI(cpf: string, password: string) {
  try {
    const response = await api.post<LoginResponse>("/login", { cpf, password });
    const { token, user } = response.data;

    if (!token || !user) {
      throw new Error("Credenciais inválidas.");
    }

    if (user.role !== "employee") {
      throw new Error("Este app é exclusivo para funcionários.");
    }

    await setStoredUserData({ token, ...user });

    return { token, user };
  } catch (error: any) {
    if (error.message === "Este app é exclusivo para funcionários." || error.message === "Credenciais inválidas.") {
      throw error;
    }

    throw new Error(getApiErrorMessage(error));
  }
}
