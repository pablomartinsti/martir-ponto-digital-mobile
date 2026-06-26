import AsyncStorage from "@react-native-async-storage/async-storage";
import { StoredUserData } from "@/types/auth";

const USER_DATA_KEY = "userData";
const RECORD_ID_KEY = "recordId";
const LOGOUT_REASON_KEY = "logoutReason";

export async function getStoredUserData(): Promise<StoredUserData | null> {
  const data = await AsyncStorage.getItem(USER_DATA_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data) as StoredUserData;
  } catch {
    await AsyncStorage.removeItem(USER_DATA_KEY);
    return null;
  }
}

export async function setStoredUserData(data: StoredUserData) {
  await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
}

export async function clearStoredUserData() {
  await AsyncStorage.multiRemove([USER_DATA_KEY, RECORD_ID_KEY]);
}

export async function getRecordId() {
  return AsyncStorage.getItem(RECORD_ID_KEY);
}

export async function setRecordId(recordId: string) {
  await AsyncStorage.setItem(RECORD_ID_KEY, recordId);
}

export async function clearRecordId() {
  await AsyncStorage.removeItem(RECORD_ID_KEY);
}

export async function setLogoutReason(reason: string) {
  await AsyncStorage.setItem(LOGOUT_REASON_KEY, reason);
}

export async function getLogoutReason() {
  return AsyncStorage.getItem(LOGOUT_REASON_KEY);
}

export async function clearLogoutReason() {
  await AsyncStorage.removeItem(LOGOUT_REASON_KEY);
}
