import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export default function QrScannerWeb({ onScan }: { onScan: (data: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(false);

  // Petit délai pour laisser le temps au composant de se charger proprement sur le web
  useEffect(() => {
    const timer = setTimeout(() => setActive(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!permission) return <View style={styles.loading}><Text>Chargement...</Text></View>;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Caméra requise pour scanner</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        {active && (
            <CameraView
                style={styles.camera}
                facing="back"
                // Compatibilité double pour le scan sur le Web
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={({ data }) => {
                    if (data) onScan(data);
                }}
            >
                <View style={styles.overlay}>
                    <Text style={styles.hint}>Visez le QR Code</Text>
                </View>
            </CameraView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // CRUCIAL POUR LE WEB : On force la taille écran complet
    height: '100vh', 
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loading: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000'
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20
  },
  text: {
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center'
  },
  btn: {
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 10
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold"
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 10
  },
  hint: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
    overflow: 'hidden' // Important pour le border-radius du texte sur web
  }
});