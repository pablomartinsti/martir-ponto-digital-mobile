// src/hooks/useLogin.ts
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginToAPI } from "@/services/authService";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipo do formulário
type FormData = {
  cpf: string;
  password: string;
};

// Esquema de validação com zod
const loginSchema = z.object({
  cpf: z
    .string()
    .nonempty("O CPF é obrigatório.")
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato de CPF inválido."),
  password: z
    .string()
    .nonempty("A senha é obrigatória.")
    .min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const cleanCpf = data.cpf.replace(/\D/g, "");

      const { token, user } = await loginToAPI(cleanCpf, data.password);

      await AsyncStorage.removeItem("recordId");
      await AsyncStorage.removeItem("startTimestamp");

      login(token, user);

      router.push("/welcome");
    } catch (error: any) {
      throw new Error(error.message || "Erro ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  return { control, handleSubmit, onSubmit, errors, isLoading };
}
