import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
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
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato de CPF inválido."),
  password: z
    .string()
    .nonempty("A senha é obrigatória.")
    .min(6, "A senha deve ter no mínimo 6 caracteres."),
});

const loginToAPI = async (cpf: string, password: string) => {
  try {
    const response = await api.post("/login", { cpf, password });

    if (response.data.token && response.data.user) {
      const { token, user } = response.data;

      // Salvar os dados no AsyncStorage
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("employeeName", user.name); // Salva o nome
      await AsyncStorage.setItem("employeeId", user.id); // Salva o ID do usuário

      return response.data;
    } else {
      throw new Error("Credenciais inválidas.");
    }
  } catch (error: any) {
    console.error("Erro ao fazer login:", error);
    throw new Error(error.response?.data?.message || "Erro ao fazer login.");
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

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const cleanCpf = data.cpf.replace(/\D/g, ""); // Remove a máscara do CPF
    setIsLoading(true);

    try {
      const response = await loginToAPI(cleanCpf, data.password);

      if (response.token) {
        // Limpa dados do funcionário anterior
        await AsyncStorage.removeItem("recordId");
        await AsyncStorage.removeItem("startTimestamp");

        // Salva o token e o employeeId do novo funcionário
        await AsyncStorage.setItem("token", response.token);
        await AsyncStorage.setItem("employeeId", response.user.id);

        // Redireciona para a tela inicial
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
      <Button title="Entrar" onPress={handleSubmit(onSubmit)} />
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
    width: 550,
    height: 550,
    marginTop: -150,
    marginBottom: -30,
  },
  view: {
    width: "100%",
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
});

export default LoginScreen;
