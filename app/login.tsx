import React from "react";
import { View, Text, StyleSheet, StatusBar, Image, Alert } from "react-native";
import { Controller } from "react-hook-form";
import MaskInput from "react-native-mask-input";
import { useLogin } from "@/hooks/useLogin";
import Button from "@/components/Button";

export default function LoginScreen() {
  const { control, handleSubmit, onSubmit, errors, isLoading } = useLogin();

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao fazer login.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#011D4C" />

      <Image
        source={require("../assets/images/Logo-Ponto-Digital.png")}
        style={styles.logo}
      />

      {/* CPF */}
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
              <Text style={styles.errorText}>{errors.cpf.message}</Text>
            )}
          </View>
        )}
      />

      {/* Senha */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View style={styles.view}>
            <MaskInput
              style={[styles.input, errors.password && styles.errorInput]}
              placeholder="Digite sua senha"
              secureTextEntry
              onChangeText={onChange}
              value={value || ""}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      <View style={styles.view}>
        <Button
          title={isLoading ? "Conectando..." : "Entrar"}
          onPress={handleSubmit(handleFormSubmit)}
          disabled={isLoading}
          loading={isLoading}
        />
      </View>
    </View>
  );
}

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
