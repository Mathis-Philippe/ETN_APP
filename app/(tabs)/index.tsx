import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useAuth } from "../../context/AuthContext";
import { parseQrData } from "../../lib/qrParser";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const { client } = useAuth();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text>Permission caméra requise</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);

    const { codeClient, reference } = parseQrData(data);

    if (reference) {
      // QR de connexion
      router.push({ pathname: "/ArticleDetail", params: { qrData: data } });
    } else if (codeClient) {
      // QR d'article
      Toast.show({
        type: "error",
        text1: "QR code invalide",
        text2: "Impossible de reconnaitre ce QR code.",
    });
    setTimeout(() => setScanned(false), 1500);
  }
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {!scanning ? (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
            Bienvenue <Text>{client?.nom ?? ""}</Text>
          </Text>

          <Text style={{ fontSize: 16, color: "#555", textAlign: "center", marginBottom: 40 }}>
            Scannez un QR code pour ajouter un article.
          </Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => {
              setScanning(true);
              setScanned(false);
            }}
          >
            <QrSvg size={28} />
            <Text style={styles.scanText}>Scanner un QR</Text>
          </TouchableOpacity>
        </>
      ) : (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleScan}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"], // 👈 important
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanBox} />
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, backgroundColor: "#fff" },
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
    gap: 10,
  },
  scanText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  camera: { flex: 1, width: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center" },
  scanBox: { width: 260, height: 260, borderWidth: 3, borderColor: "#1e90ff", borderRadius: 20 },
  buttonText: { color: "#1e90ff", fontSize: 16, fontWeight: "600", marginTop: 15 },
});
