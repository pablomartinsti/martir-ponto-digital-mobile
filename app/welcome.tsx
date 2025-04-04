import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Button from "@/components/Button";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Bem-vindo ao Ponto Martir!</Text>

        <View>
          <Text style={styles.caption}>Sobre o Aplicativo</Text>
          <Text style={styles.description}>
            O Ponto Martir foi desenvolvido para simplificar o registro do seu
            ponto. Com ele, você pode gerenciar sua jornada de trabalho de forma
            prática e eficiente, diretamente do seu dispositivo móvel.
          </Text>
        </View>

        <View>
          <Text style={styles.caption}>Principais Funcionalidades</Text>
          <Text style={styles.description}>
            1. Registre sua entrada ao chegar na empresa.
          </Text>
          <Text style={styles.description}>
            2. Registre sua saída para o intervalo de almoço.
          </Text>
          <Text style={styles.description}>
            3. Registre seu retorno do intervalo de almoço.
          </Text>
          <Text style={styles.description}>
            4. Finalize sua jornada com o registro de saída.
          </Text>
          <Text style={styles.description}>
            5. Acesse relatórios detalhados de suas horas trabalhadas, com
            filtros por dia, semana, mês e ano.
          </Text>
        </View>

        <View>
          <Text style={styles.caption}>Regras de Utilização</Text>
          <Text style={styles.description}>
            Para registrar o ponto, você deve:
          </Text>
          <Text style={styles.description}>
            - Estar dentro da área autorizada da empresa.
          </Text>
          <Text style={styles.description}>
            - Autorizar o uso do GPS do seu celular para validar sua
            localização.
          </Text>
          <Text style={styles.description}>
            - Certificar-se de estar conectado à rede Wi-Fi da empresa ou a uma
            conexão válida.
          </Text>
        </View>

        <View style={styles.containerButton}>
          <Button
            title="Entendi e Continuar"
            onPress={() => router.push("/recordsPoint")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#011D4C",
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 26, // Ajuste para garantir boa legibilidade
    fontWeight: "bold",
    marginBottom: 20,
    color: "#E8B931",
    textAlign: "center",
  },
  caption: {
    color: "#E8B931",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    color: "#fff",
    fontSize: 16, // Ajustado para ser mais legível em telas menores
    textAlign: "justify",
    marginBottom: 15, // Melhor espaçamento entre parágrafos
  },
  containerButton: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});
