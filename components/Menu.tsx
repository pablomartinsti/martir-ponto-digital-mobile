import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/authContext';

const MenuComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleNavigation = (path: any) => {
    setModalVisible(false);
    setTimeout(() => {
      router.push(path);
    }, 250);
  };

  return (
    <View style={[styles.menuContainer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <TouchableOpacity style={styles.menuButton} onPress={() => setModalVisible(true)} activeOpacity={0.75}>
        <Image
          source={require('@/assets/icons/menu.png')}
          style={{
            width: 30,
            height: 30,
            tintColor: '#fff'
          }}
        />
        <Text style={styles.menuLabel}>Menu</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuButton} onPress={logout} activeOpacity={0.75}>
        <Image
          source={require('@/assets/icons/logout.png')}
          style={{
            width: 30,
            height: 30,
            tintColor: '#fff'
          }}
        />
        <Text style={styles.menuLabel}>Sair</Text>
      </TouchableOpacity>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalContainer} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Relatório de Horas</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleNavigation('/recordsPoint')}
              activeOpacity={0.75}
            >
              <Image
                source={require('@/assets/icons/work.png')}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: '#fff'
                }}
              />
              <Text style={styles.modalText}>Iniciar jornada</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleNavigation('/dayFilter')}
              activeOpacity={0.75}
            >
              <Image
                source={require('@/assets/icons/today.png')}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: '#fff'
                }}
              />
              <Text style={styles.modalText}>Dia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleNavigation('/weekFilter')}
              activeOpacity={0.75}
            >
              <Image
                source={require('@/assets/icons/date_range.png')}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: '#fff'
                }}
              />
              <Text style={styles.modalText}>Semana</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleNavigation('/monthFilter')}
              activeOpacity={0.75}
            >
              <Image
                source={require('@/assets/icons/calendar_month.png')}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: '#fff'
                }}
              />
              <Text style={styles.modalText}>Mês</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)} activeOpacity={0.75}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E8B931',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  menuButton: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#011D4C',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
    textAlign: 'center'
  },
  modalButton: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  closeButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#E8B931',
    marginTop: 24,
    alignItems: 'center',
    borderRadius: 10
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default MenuComponent;
