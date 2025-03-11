import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Text,
  Alert,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import dayjs from "dayjs";
import "dayjs/locale/pt-br"; // Importa o idioma português

dayjs.locale("pt-br"); // Define o idioma globalmente

const MenuComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const logout = async () => {
    try {
      await AsyncStorage.clear(); // Limpa os dados do armazenamento assíncrono

      // 🔹 Dispara um evento global para resetar o estado no RecordPoint
      setTimeout(() => {
        router.push("/login");
        router.replace("/login"); // Garante que o usuário volte para login
      }, 500); // Pequeno delay para garantir que a limpeza do AsyncStorage ocorra antes do redirecionamento
    } catch (error) {
      console.error("Erro ao sair:", error);
      Alert.alert("Erro", "Não foi possível sair.");
    }
  };

  return (
    <View style={styles.menuContainer}>
      {/* Botão para abrir o menu */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="menu" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Botão de logout */}
      <TouchableOpacity style={styles.menuButton} onPress={logout}>
        <Icon name="logout" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal do Menu */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Relatorio de Horas</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => router.push("/recordsPoint")}
            >
              <Icon name="work" size={30} color="#fff" />
              <Text style={styles.modalText}>Iniciar jornada</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => router.push("/dayFilter")}
            >
              <Icon name="today" size={30} color="#fff" />
              <Text style={styles.modalText}>Dia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => router.push("/weekFilter")}
            >
              <Icon name="today" size={30} color="#fff" />
              <Text style={styles.modalText}>Semanal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => router.push("/monthFilter")}
            >
              <Icon name="today" size={30} color="#fff" />
              <Text style={styles.modalText}>Mês</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => router.push("/monthFilter")}
            >
              <Icon name="today" size={30} color="#fff" />
              <Text style={styles.modalText}>Ano</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 30,
    position: "absolute",
    bottom: 0,
    backgroundColor: "#E8B931",
  },
  menuButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  view: {
    width: "85%",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fundo escuro transparente
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#011D4C",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
  },
  modalButton: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    padding: 12,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 5,
  },
  closeButton: {
    width: "100%",
    padding: 12,
    backgroundColor: "#E8B931",
    marginTop: 30,
    alignItems: "center",
    borderRadius: 5,
  },
  modalText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default MenuComponent;
