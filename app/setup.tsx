import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useConfig } from "../core/config/ConfigContext";
import { AppConfig } from "../core/config/types";

const DEFAULTS: AppConfig = {
  keycloakUrl: "https://keycloak.example.com",
  realm: "home",
  clientId: "homelab-portal",
  argocdUrl: "https://argocd.example.com",
  grafanaUrl: "https://grafana.example.com",
};

type Field = { label: string; key: keyof AppConfig; placeholder: string };

const FIELDS: Field[] = [
  {
    label: "Keycloak URL",
    key: "keycloakUrl",
    placeholder: "https://keycloak.example.com",
  },
  { label: "Realm", key: "realm", placeholder: "home" },
  { label: "Client ID", key: "clientId", placeholder: "homelab-portal" },
  {
    label: "ArgoCD URL",
    key: "argocdUrl",
    placeholder: "https://argocd.example.com",
  },
  {
    label: "Grafana URL",
    key: "grafanaUrl",
    placeholder: "https://grafana.example.com",
  },
];

export default function SetupScreen() {
  const { setConfig } = useConfig();
  const [form, setForm] = useState<AppConfig>(DEFAULTS);

  const handleSave = async () => {
    await setConfig(form);
    router.replace("/(auth)/login");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Configure Portal</Text>
        <Text style={styles.subtitle}>Set your homelab endpoints</Text>

        {FIELDS.map(({ label, key, placeholder }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              placeholder={placeholder}
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save & Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: "bold", color: "#fff", marginTop: 48 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 8 },
  field: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#aaa",
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#fff",
    backgroundColor: "#1e2327",
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
