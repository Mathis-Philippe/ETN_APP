import { useState } from "react";
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import { parseQrData } from "../../lib/qrParser";
import QrScanner from "../../components/QrScanner";

export default function LoginScreen() {
  const { loginWithQr, loginWithPassword, loadingLogin } = useAuth();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  
  // --- NOUVEAU : État pour afficher/masquer le login manuel ---
  // Par défaut c'est caché (false), donc le client ne voit rien.
  const [showManual, setShowManual] = useState(false);

  const [manualCode, setManualCode] = useState("");
  const [manualPass, setManualPass] = useState("");

  const handleScan = async (data: string) => {
    if (scanned) return;
    setScanned(true);

    const { codeClient } = parseQrData(data);

    if (!codeClient) {
      Toast.show({
        type: "error",
        text1: "QR Code invalide ❌",
        text2: "Veuillez scanner un QR client.",
      });
      setCameraVisible(false);
      setTimeout(() => setScanned(false), 1500);
      return;
    }

    const success = await loginWithQr(data);
    setCameraVisible(false);

    if (success) {
      Toast.show({ type: "success", text1: "Connexion réussie ✅" });
    } else {
      Toast.show({ type: "error", text1: "Erreur", text2: "Client inconnu" });
    }

    setTimeout(() => setScanned(false), 1500);
  };

  const handleManualLogin = async () => {
    if (!manualCode.trim()) {
      Toast.show({ type: "error", text1: "Champ vide", text2: "Code client requis." });
      return;
    }
    if (!manualPass.trim()) {
      Toast.show({ type: "error", text1: "Champ vide", text2: "Mot de passe requis." });
      return;
    }

    const success = await loginWithPassword(manualCode, manualPass);

    if (success) {
      Toast.show({ type: "success", text1: "Connexion réussie ✅" });
    } else {
      Toast.show({ 
        type: "error", 
        text1: "Connexion échouée", 
        text2: "Vérifiez vos identifiants." 
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require("../../assets/images/etn.png")} style={styles.logo} />

        <Text style={styles.title}>Bienvenue chez ETN</Text>
        <Text style={styles.subtitle}>
          Espace Client
        </Text>

        {/* Bouton scanner (Principal - Toujours visible) */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => {
            setScanned(false);
            setCameraVisible(true);
          }}
        >
          <Text style={styles.scanButtonText}>📸 Scanner mon QR Code</Text>
        </TouchableOpacity>

        {/* --- SECTION LOGIN MANUEL (CACHÉE PAR DÉFAUT) --- */}
        {showManual && (
          <View style={styles.manualLoginContainer}>
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>ADMINISTRATION</Text>
              <View style={styles.line} />
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Identifiant (ex: C0000031)"
              placeholderTextColor="#94a3b8"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#94a3b8"
              value={manualPass}
              onChangeText={setManualPass}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.manualButton}
              onPress={handleManualLogin}
              disabled={loadingLogin}
            >
              {loadingLogin ? (
                <ActivityIndicator color="#2563EB" />
              ) : (
                <Text style={styles.manualButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* BOUTON DISCRET POUR AFFICHER/MASQUER */}
        <TouchableOpacity 
            onPress={() => setShowManual(!showManual)} 
            style={styles.toggleButton}
        >
            <Text style={styles.toggleButtonText}>
                {showManual ? "Masquer accès administratif" : "Connexion administrative"}
            </Text>
        </TouchableOpacity>


        {/* Caméra Modal */}
        <Modal visible={cameraVisible} animationType="slide">
          <QrScanner onScan={handleScan} />
          <View style={styles.closeWrapper}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCameraVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: { width: 140, height: 140, resizeMode: "contain", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#1E293B", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#64748B", textAlign: "center", marginBottom: 30 },
  
  scanButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
    marginBottom: 20, // Espace ajouté
  },
  scanButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  /* Styles Login Manuel */
  manualLoginContainer: { width: "100%", maxWidth: 300, marginTop: 10, alignItems: "center" },
  divider: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 15 },
  line: { flex: 1, height: 1, backgroundColor: "#cbd5e1" },
  orText: { marginHorizontal: 10, color: "#94a3b8", fontWeight: "600", fontSize: 12 },
  
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: "#1e293b",
  },
  manualButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2563EB",
    paddingVertical: 12,
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
  },
  manualButtonText: { color: "#2563EB", fontWeight: "700", fontSize: 16 },

  /* Bouton Discret (Toggle) */
  toggleButton: {
    marginTop: 30,
    padding: 10,
  },
  toggleButtonText: {
    color: "#94a3b8", // Gris clair discret
    fontSize: 14,
    textDecorationLine: "underline",
  },

  /* Caméra Overlay */
  closeWrapper: { position: "absolute", bottom: 40, alignSelf: "center" },
  closeButton: { backgroundColor: "#DC2626", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  closeButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});