import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { View, TouchableOpacity, Modal, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useAuth } from "@/contexts/authContext";

dayjs.locale("pt-br");

const MenuComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const { logout } = useAuth();

  const handleNavigation = (path: any) => {
    setModalVisible(false);
    setTimeout(() => {
      router.push(path);
    }, 300);
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
            <Text style={styles.modalTitle}>Relatório de Horas</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleNavigation("/recordsPoint")}
            >
              <Icon name="work" size={30} color="#fff" />
              <Text style={styles.modalText}>Iniciar jornada</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleNavigation("/dayFilter")}
            >
              <Icon name="today" size={30} color="#fff" />
              <Text style={styles.modalText}>Dia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleNavigation("/weekFilter")}
            >
              <Icon name="today" size={30} color="#fff" />
              <Text style={styles.modalText}>Semana</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleNavigation("/monthFilter")}
            >
              <Icon name="today" size={30} color="#fff" />
              <Text style={styles.modalText}>Mês</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
