import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../core/auth/AuthContext";
import { useKeycloak } from "../../core/auth/useKeycloak";

export default function LoginScreen() {
  const { login } = useAuth();
  const { isReady } = useKeycloak();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await login();
      router.replace("/(app)");
    } catch (e) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Homelab Portal</Text>
      <Text style={styles.subtitle}>Your homelab, one place</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" />
      ) : (
        <TouchableOpacity
          style={[styles.button, !isReady && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!isReady}
        >
          <Text style={styles.buttonText}>Login with SSO</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#111",
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#888", marginBottom: 48 },
  error: { color: "#ef4444", marginBottom: 24, textAlign: "center" },
  button: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: { backgroundColor: "#374151" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
