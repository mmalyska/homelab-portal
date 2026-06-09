import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../core/auth/AuthContext";

type Feature = { id: string; label: string; emoji: string; route: string };

const FEATURES: Feature[] = [
  { id: "argocd", label: "ArgoCD", emoji: "🚀", route: "/(app)/argocd" },
  { id: "grafana", label: "Grafana", emoji: "📊", route: "/(app)/grafana" },
];

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.greeting}>
        Welcome, {user?.preferred_username ?? "user"}
      </Text>

      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={styles.card}
            onPress={() => router.push(f.route as never)}
          >
            <Text style={styles.cardEmoji}>{f.emoji}</Text>
            <Text style={styles.cardLabel}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#111" },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 32,
    marginTop: 16,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: {
    width: "46%",
    aspectRatio: 1,
    backgroundColor: "#1e2327",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  cardEmoji: { fontSize: 40 },
  cardLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  logout: { marginTop: "auto", alignItems: "center", padding: 16 },
  logoutText: { color: "#ef4444", fontSize: 16 },
});
