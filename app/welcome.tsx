import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Button from "@/components/Button";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
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
          5. Acesse relatórios detalhados de suas horas trabalhadas, com filtros
          por dia, semana, mês e ano.
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
          - Autorizar o uso do GPS do seu celular para validar sua localização.
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between", // Melhor espaçamento entre os elementos
    alignItems: "flex-start",
    backgroundColor: "#011D4C",
    padding: 15,
  },
  title: {
    fontSize: 28, // Aumenta levemente o tamanho da fonte para dar mais destaque
    fontWeight: "bold",
    marginBottom: 15, // Reduz o espaçamento para melhor equilíbrio
    color: "#E8B931", // Muda a cor do título para o amarelo principal para destaque
    textAlign: "center", // Centraliza o título
  },
  caption: {
    color: "#E8B931",
    fontSize: 20, // Levemente menor que o título, mas ainda destacada
    fontWeight: "bold",

    marginBottom: 10, // Adiciona espaçamento abaixo do título da seção
  },
  description: {
    color: "#fff",
    fontSize: 16, // Reduzido levemente para diferenciar das legendas
    textAlign: "justify", // Justifica o texto para uma aparência mais formal
    marginBottom: 10, // Adiciona um espaço entre os parágrafos
  },
  containerButton: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10, // Adiciona um espaçamento acima do botão
  },
});
