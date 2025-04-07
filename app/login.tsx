import React, { useState } from "react";
import { useAuth } from "@/contexts/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  StatusBar,
  Image,
  TextInput,
} from "react-native";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import MaskInput from "react-native-mask-input";
import api from "../services/api";
import { useRouter } from "expo-router";
import Button from "@/components/Button";

// Tipo dos dados do formulário
type FormData = {
  cpf: string;
  password: string;
};

// Esquema de validação com Zod
const loginSchema = z.object({
  cpf: z
    .string()
    .nonempty("O CPF é obrigatório.")
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato de CPF inválido.")
    .transform((val) => val.trim()),
  password: z
    .string()
    .nonempty("A senha é obrigatória.")
    .min(6, "A senha deve ter no mínimo 6 caracteres.")
    .transform((val) => val.trim()),
});

const loginToAPI = async (cpf: string, password: string) => {
  try {
    const response = await api.post("/login", { cpf, password });

    if (response.data.token && response.data.user) {
      const { token, user } = response.data;

      if (user.role !== "employee") {
        throw new Error("Este app é exclusivo para funcionários.");
      }

      // Salvar os dados no AsyncStorage
      await AsyncStorage.setItem(
        "userData",
        JSON.stringify({ token, ...user })
      );

      return response.data;
    } else {
      throw new Error("Credenciais inválidas.");
    }
  } catch (error: any) {
    console.error("Erro ao fazer login:", error);

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
};

const LoginScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  // Dentro do componente LoginScreen:
  const { login } = useAuth(); // usa o login do contexto

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const cleanCpf = data.cpf.replace(/\D/g, ""); // Remove a máscara do CPF
    setIsLoading(true);

    try {
      const response = await loginToAPI(cleanCpf, data.password);

      if (response.token && response.user) {
        // Limpa dados do funcionário anterior
        await AsyncStorage.removeItem("recordId");
        await AsyncStorage.removeItem("startTimestamp");

        // Atualiza o contexto de autenticação
        login(response.token, response.user);

        // Redireciona (o contexto já redireciona também, mas isso garante fluidez)
        router.push("/welcome");
      } else {
        Alert.alert("Erro", "Credenciais inválidas.");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#011D4C" />

      <Image
        source={require("../assets/images/Logo-Ponto-Digital.png")}
        style={styles.logo}
      />

      {/* Campo CPF */}
      <Controller
        control={control}
        name="cpf"
        render={({ field: { onChange, value } }) => (
          <View style={styles.view}>
            <MaskInput
              value={value || ""}
              onChangeText={onChange}
              mask={[
                /\d/,
                /\d/,
                /\d/,
                ".",
                /\d/,
                /\d/,
                /\d/,
                ".",
                /\d/,
                /\d/,
                /\d/,
                "-",
                /\d/,
                /\d/,
              ]}
              style={[styles.input, errors.cpf && styles.errorInput]}
              placeholder="Digite seu CPF"
              keyboardType="numeric"
            />
            {errors.cpf && (
              <Text style={styles.errorText}>
                {typeof errors.cpf.message === "string"
                  ? errors.cpf.message
                  : ""}
              </Text>
            )}
          </View>
        )}
      />

      {/* Campo Senha */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View style={styles.view}>
            <TextInput
              style={[styles.input, errors.password && styles.errorInput]}
              placeholder="Digite sua senha"
              secureTextEntry
              onChangeText={onChange}
              value={value || ""}
            />
            {errors.password && (
              <Text style={styles.errorText}>
                {typeof errors.password.message === "string"
                  ? errors.password.message
                  : ""}
              </Text>
            )}
          </View>
        )}
      />
      <View style={styles.view}>
        <Button
          title={isLoading ? "Conectando..." : "Entrar"}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          loading={isLoading}
        />
        {isLoading && (
          <Text style={styles.loadingText}>
            Aguardando o servidor iniciar... Isso pode levar alguns segundos.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#011D4C",
  },
  logo: {
    width: 450,
    height: 450,
    marginTop: -150,
    marginBottom: -30,
  },
  view: {
    width: "90%",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#E8B931",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  errorInput: {
    borderColor: "#FF0000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  loadingText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});

export default LoginScreen;
