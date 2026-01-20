import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons"; // Pour l'icône flash

export default function QrScanner({ onScan }: { onScan: (data: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false); // État pour le flash

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Accès caméra requis</Text>
        <Button onPress={requestPermission} title="Autoriser la caméra" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torch} // Active le flash si demandé
        autofocus="on" // FORCE LE FOCUS pour Android
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => onScan(data)}
      >
        {/* Bouton pour activer/désactiver le flash - aide au focus en basse lumière */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.torchButton, torch && styles.torchActive]} 
            onPress={() => setTorch(!torch)}
          >
            <MaterialIcons name={torch ? "flash-on" : "flash-off"} size={24} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  message: {
    marginBottom: 10,
    fontSize: 16,
    textAlign: "center"
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  torchButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 50,
  },
  torchActive: {
    backgroundColor: '#FFD700',
  }
});