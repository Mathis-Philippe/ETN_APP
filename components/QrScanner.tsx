import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { Ionicons } from "@expo/vector-icons"; // Assure-toi d'avoir les icônes

type Props = {
  onScan: (data: string) => void;
};

export default function QrScanner({ onScan }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginBottom: 10 }}>
          Permission caméra requise
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btn}>
          <Text style={styles.btnText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    onScan(result.data);
    setTimeout(() => setScanned(false), 2000); 
  };

  // Gestion du Zoom
  const handleZoom = (factor: number) => {
    let newZoom = zoom + factor;
    if (newZoom < 0) newZoom = 0;
    if (newZoom > 1) newZoom = 1; // Le zoom max est 1 (100% du zoom digital supporté)
    setZoom(newZoom);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        onBarcodeScanned={handleBarcodeScanned}
        enableTorch={false}
        ratio="16:9"
        autofocus="on" // 👈 CRUCIAL pour Android
        zoom={0.1}    // 👈 Gestion du zoom
        responsiveOrientationWhenOrientationLocked
      >
        {/* Overlay pour guider l'utilisateur */}
        <View style={styles.overlay}>
          <View style={styles.controls}>
            
            {/* Contrôles de Zoom */}
            <View style={styles.zoomContainer}>
              <TouchableOpacity onPress={() => handleZoom(-0.1)} style={styles.zoomBtn}>
                <Ionicons name="remove-circle-outline" size={32} color="white" />
              </TouchableOpacity>
              <Text style={styles.zoomText}>{(zoom * 10).toFixed(1)}x</Text>
              <TouchableOpacity onPress={() => handleZoom(0.1)} style={styles.zoomBtn}>
                <Ionicons name="add-circle-outline" size={32} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bouton pour changer de caméra (Flip) */}
            <TouchableOpacity 
              style={styles.flipBtn}
              onPress={() => setFacing(current => (current === "back" ? "front" : "back"))}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="white" />
            </TouchableOpacity>

          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end", // Contrôles en bas
    paddingBottom: 40,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    width: "100%",
  },
  zoomContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
  zoomBtn: {
    padding: 5,
  },
  zoomText: {
    color: "white",
    fontWeight: "bold",
    marginHorizontal: 10,
    minWidth: 30,
    textAlign: "center",
  },
  flipBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 50,
  },
  btn: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "600",
  },
});