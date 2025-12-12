import { useEffect, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { CameraView } from "expo-camera";

export default function QrScanner({ onScan }: { onScan: (data: string) => void }) {

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={({ data }) => {
            if (data) onScan(data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%', 
    ...Platform.select({
      web: {
        objectFit: 'cover',
      }
    })
  },
});