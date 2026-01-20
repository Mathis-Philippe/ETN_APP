import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

export default function QrScanner({ onScan }: { onScan: (data: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const isFocused = useIsFocused();

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.message}>Accès caméra requis</Text>
        <Button onPress={requestPermission} title="Autoriser la caméra" />
      </View>
    );
  }

  // Petit délai ou écran noir si pas focus (aide le cycle de vie Android)
  if (!isFocused) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {/* LA CAMÉRA : On force la taille à 100% absolue */}
      <CameraView
        style={StyleSheet.absoluteFill} 
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => onScan(data)}
      />

      {/* LES CONTRÔLES : Posés par dessus */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.torchButton, torch && styles.torchActive]} 
          onPress={() => setTorch(!torch)}
        >
          <MaterialIcons name={torch ? "flash-on" : "flash-off"} size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fond noir : si la caméra ne charge pas, on verra du noir au lieu du blanc
  },
  centeredContainer: {
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
    bottom: 50,
    alignSelf: 'center',
    zIndex: 10,
  },
  torchButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  torchActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  }
});