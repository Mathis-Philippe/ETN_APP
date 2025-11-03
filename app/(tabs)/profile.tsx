import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

const ProfileScreen: React.FC = () => {
  const { client, logout } = useAuth();
  const router = useRouter();

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Aucun profil trouvé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="business" size={64} color="#4A90E2" />
        <Text style={styles.title}>Profil Société</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <MaterialIcons name="badge" size={22} color="#4A90E2" />
          <Text style={styles.label}>Nom :</Text>
          <Text style={styles.value}>{client.nom}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <MaterialIcons name="location-on" size={22} color="#4A90E2" />
          <Text style={styles.label}>Adresse :</Text>
          <Text style={styles.value}>
            {client.adresse} {client.code_postal} {client.ville}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push("/OrdersScreen")}
      >
        <MaterialIcons name="shopping-cart" size={20} color="#fff" />
        <Text style={styles.logoutText}>Mes commandes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F7", padding: 20, marginTop: 20 },
  header: { alignItems: "center", marginBottom: 30 },
  title: { fontSize: 26, fontWeight: "700", marginTop: 12, color: "#1F2937" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  label: { fontSize: 16, fontWeight: "600", marginLeft: 10, color: "#374151", width: 120 },
  value: { fontSize: 16, color: "#6B7280", flex: 1, flexWrap: "wrap" },
  separator: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 20,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 10 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 10,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { fontSize: 18, color: "#DC2626", fontWeight: "600" },
});
