import { useState } from "react";
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import { parseQrData } from "../../lib/qrParser";
// MODIFIÉ: Import du composant QrScanner cross-platform (qui gère la logique de la caméra native/web)
import QrScanner from "../../components/QrScanner";

export default function LoginScreen() {
  const { loginWithQr } = useAuth();
  // SUPPRIMÉ: Les permissions sont maintenant gérées à l'intérieur de QrScanner.
  // const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  // CHANGÉ: La fonction QrScanner fournit la chaîne de données scannées directement
  const handleScan = async (data: string) => {
    if (scanned) return;
    setScanned(true);

    console.log("📷 QR Code Scanné:", data);

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

    if (!success) {
      Toast.show({
        type: "error",
        text1: "Connexion échouée ❌",
      });
    } else {
      Toast.show({
        type: "success",
        text1: "Connexion réussie ✅",
      });
    }

    setTimeout(() => setScanned(false), 1500);
  };

  return (
    <View style={styles.container}>
      {/* Logo, Titre, Subtitle restent inchangés */}
      <Image source={require("../../assets/images/etn.png")} style={styles.logo} />

      <Text style={styles.title}>Bienvenue chez ETN</Text>
      <Text style={styles.subtitle}>
        Connectez-vous en scannant votre QR code client
      </Text>

      {/* Bouton scanner */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => {
          // L'ouverture est gérée ici. Les permissions sont gérées à l'intérieur de QrScanner.
          setScanned(false);
          setCameraVisible(true);
        }}
      >
        <Text style={styles.scanButtonText}>Scanner mon QR Code</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity
        style={{ marginTop: 30, padding: 10, backgroundColor: "#e2e8f0", borderRadius: 8 }}
        onPress={() => {
          // Remplacez 'CT001' par un code client RÉEL de votre base de données
          handleScan("Code client: C0000031"); 
        }}
      >
        <Text style={{ color: "#475569", fontWeight: "bold" }}>
          💻 Connexion Dev (Sans Caméra)
        </Text>
      </TouchableOpacity> */}

      {/* Caméra */}
      <Modal visible={cameraVisible} animationType="slide">
        {/* REMPLACÉ: Utilisation du QrScanner cross-platform */}
        <QrScanner
          onScan={handleScan} // Passe la fonction de scan
        />

        {/* Cadre de scan (laissez-le si vous voulez l'overlay visuel) */}
        <View style={styles.scanFrame} />

        {/* Bouton fermer */}
        <View style={styles.closeWrapper}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setCameraVisible(false)}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
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
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  scanFrame: {
    position: "absolute",
    top: "30%",
    left: "15%",
    width: "70%",
    height: 270,
    borderWidth: 3,
    borderColor: "#ffffffff",
    borderRadius: 16,
  },
  closeWrapper: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  closeButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});