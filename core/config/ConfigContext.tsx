import React, { createContext, useContext, useEffect, useState } from "react";
import { AppConfig } from "./types";
import { loadConfig, saveConfig } from "./configStorage";

type ConfigContextType = {
  config: AppConfig | null;
  isLoading: boolean;
  setConfig: (config: AppConfig) => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig().then((c) => {
      setConfigState(c);
      setIsLoading(false);
    });
  }, []);

  const setConfig = async (newConfig: AppConfig) => {
    await saveConfig(newConfig);
    setConfigState(newConfig);
  };

  return (
    <ConfigContext.Provider value={{ config, isLoading, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
