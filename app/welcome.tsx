import React from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Ponto Martit!</Text>
      <View>
        <Text style={styles.caption}>Descrição do App</Text>
        <Text style={styles.description}>
          Este aplicativo permite que você registre seu ponto de forma simples e
          prática. Para isso, você deve estar dentro da empresa.
        </Text>
      </View>
      <View>
        <Text style={styles.caption}>Funcionalidades</Text>
        <Text style={styles.description}>
          1. Bata o ponto ao chegar na empresa.
        </Text>
        <Text style={styles.description}>
          2. Registre sua saída para o almoço.
        </Text>
        <Text style={styles.description}>
          3. Registre seu retorno do almoço.
        </Text>
        <Text style={styles.description}>
          4. Bata o ponto ao finalizar sua jornada.
        </Text>
      </View>
      <View>
        <Text style={styles.caption}>Regras de Uso</Text>
        <Text style={styles.description}>
          Você só poderá registrar o ponto dentro da área da empresa. Verifique
          se está conectado à rede ou ao Wi-Fi da empresa.
        </Text>
      </View>

      <View style={styles.containerButton}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/recordsPoint")}
        >
          <Text style={styles.button}>Entendi e Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#011D4C",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
  },
  caption: {
    color: "#E8B931",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  description: {
    color: "#fff",
    fontSize: 19,
  },
  containerButton: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#E8B931",
    color: "#fff",
    fontSize: 30,
    padding: 5,
    width: "100%",
    borderRadius: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
});
