import { useRouter, useLocalSearchParams } from "expo-router"; // AJOUT: useLocalSearchParams
import { useState, useEffect } from "react"; // AJOUT: useEffect
import { StyleSheet, Text, TouchableOpacity, View, StatusBar as RNStatusBar, Platform } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useAuth } from "../../context/AuthContext";
import { parseQrData } from "../../lib/qrParser";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import QrScanner from "../../components/QrScanner";
import { Ionicons } from "@expo/vector-icons"; 

export default function HomeScreen() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  
  const router = useRouter();
  const { autostart } = useLocalSearchParams(); // Récupère le paramètre
  const { client } = useAuth();

  // NOUVEAU : Détecte si on vient du panier avec la demande d'ouverture auto
  useEffect(() => {
    if (autostart === 'true') {
      setScanning(true);
      setScanned(false);
      // On nettoie le paramètre pour éviter que ça se rouvre en boucle si on navigue
      router.setParams({ autostart: undefined });
    }
  }, [autostart]);

  const handleScan = (data: string) => {
    if (scanned) return;
    setScanned(true);

    const { codeClient, reference } = parseQrData(data);

    if (reference) {
      setScanning(false);
      router.push({ pathname: "/ArticleDetail", params: { qrData: data } });
    } else if (codeClient) {
      setScanning(false);
      Toast.show({
        type: "error",
        text1: "QR code invalide",
        text2: "Ce QR code est destiné à la connexion.",
      });
    } else {
       setScanning(false);
       Toast.show({
        type: "error",
        text1: "QR code inconnu",
        text2: "Impossible de reconnaître ce format.",
      });
    }

    setTimeout(() => setScanned(false), 2000);
  };

  function QrSvg({ size = 28 }: { size?: number }) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="2" width="6" height="6" stroke="#fff" strokeWidth="1.5" />
        <Rect x="16" y="2" width="6" height="6" stroke="#fff" strokeWidth="1.5" />
        <Rect x="2" y="16" width="6" height="6" stroke="#fff" strokeWidth="1.5" />
        <Path d="M9 9h2v2H9zM9 16h2v2H9zM16 9h2v2h-2zM13 13h3v3h-3z" fill="#fff" />
      </Svg>
    );
  }

  // --- MODE SCANNER ---
  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <StatusBar style="light" />
        <QrScanner onScan={handleScan} />

        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => setScanning(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#fff" />
          <Text style={styles.closeText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- MODE ACCUEIL ---
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Text style={styles.welcomeTitle}>
        Bienvenue <Text style={styles.clientName}>{client?.nom ?? ""}</Text>
      </Text>

      <Text style={styles.instructionText}>
        Scannez un QR code pour ajouter un article.
      </Text>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => {
          setScanning(true);
          setScanned(false);
        }}
        activeOpacity={0.8}
      >
        <QrSvg size={28} />
        <Text style={styles.scanText}>Scanner un QR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: 20 
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  welcomeTitle: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center",
    color: "#333"
  },
  clientName: {
    color: "#1e90ff"
  },
  instructionText: { 
    fontSize: 16, 
    color: "#666", 
    textAlign: "center", 
    marginBottom: 40,
    lineHeight: 22
  },
  scanButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#1e90ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scanText: { 
    color: "#fff", 
    fontSize: 17, 
    fontWeight: "600" 
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 50
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  }
});