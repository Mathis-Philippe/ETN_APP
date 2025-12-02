import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Camera, CameraView } from "expo-camera";

export default function QrScanner({ onScan }: { onScan: (data: string) => void }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return <Text>Demande de permission…</Text>;
  }

  if (!hasPermission) {
    return <Text>Permission refusée</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => onScan(data)}
      />
    </View>
  );
}
