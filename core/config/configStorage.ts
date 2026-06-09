import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppConfig } from "./types";

const CONFIG_KEY = "app.config";

export const saveConfig = (config: AppConfig): Promise<void> =>
  AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));

export const loadConfig = async (): Promise<AppConfig | null> => {
  const raw = await AsyncStorage.getItem(CONFIG_KEY);
  return raw ? (JSON.parse(raw) as AppConfig) : null;
};

export const clearConfig = (): Promise<void> =>
  AsyncStorage.removeItem(CONFIG_KEY);
