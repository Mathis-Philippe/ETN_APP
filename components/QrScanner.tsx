import { View, Text, Button, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function QrScanner({ onScan }: { onScan: (data: string) => void }) {
  // Le hook charge le statut actuel sans forcer la popup système
  const [permission, requestPermission] = useCameraPermissions();

  // 1. Tant que le hook vérifie le statut (c'est très rapide), on affiche une vue vide
  if (!permission) {
    return <View />;
  }

  // 2. Si la permission n'est PAS accordée, on affiche un message et un bouton.
  // IMPORTANT : On ne lance pas requestPermission() automatiquement ici, sinon ça boucle.
  // C'est l'utilisateur qui doit cliquer.
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Accès caméra requis</Text>
        <Button onPress={requestPermission} title="Autoriser la caméra" />
      </View>
    );
  }

  // 3. Si on arrive ici, c'est que permission.granted est TRUE.
  // Le téléphone se souvient du choix et affiche direct la caméra.
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
  }
});