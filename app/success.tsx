// app/success.tsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Icône ✅ */}
      <View style={styles.iconWrapper}>
        <MaterialIcons name="check-circle" size={100} color="#27AE60" />
      </View>

      {/* Texte */}
      <Text style={styles.title}>Commande confirmée.</Text>
      <Text style={styles.subtitle}>
        Merci pour votre commande ! Nos équipes s&apos;occupent de la préparer !
      </Text>

      {/* Bouton retour */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/")}
      >
        <Text style={styles.buttonText}>Retour à l&apos;accueil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F9FC", padding: 20 },
  iconWrapper: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2C3E50", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#7F8C8D", textAlign: "center", marginTop: 10, marginBottom: 30, paddingHorizontal: 20 },
  button: {
    backgroundColor: "#3498DB",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
