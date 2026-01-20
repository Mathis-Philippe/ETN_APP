import { View, StyleSheet, Text, Platform, TouchableOpacity, TextStyle, ViewStyle } from "react-native";
import { CameraView } from "expo-camera";
import { useState, useEffect } from "react";

export default function QrScannerWeb({ onScan }: { onScan: (data: string) => void }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [key, setKey] = useState(0);

  // Vérification au montage si on a déjà la permission (pour éviter de redemander)
  useEffect(() => {
    // Petit check rapide pour voir si on a déjà l'accès
    if (Platform.OS === 'web' && navigator.mediaDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            // Si on a des labels (ex: "Back Camera"), c'est qu'on a la permission
            if (videoInputs.some(d => d.label !== '')) {
                setHasPermission(true);
            }
        }).catch(() => {});
    }
  }, []);

  const handleRequestPermission = async (e?: any) => {
    // Si l'événement existe, on empêche les comportements par défaut bizarres
    if (e && e.preventDefault) e.preventDefault();

    console.log("Tentative d'accès caméra...");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        // Succès !
        console.log("Accès accordé.");
        stream.getTracks().forEach(track => track.stop()); // On coupe le flux test
        setHasPermission(true);
        setKey(prev => prev + 1); // Force le reload propre de la caméra

    } catch (err: any) {
        console.error("Erreur:", err);
        // Si c'est une erreur NotAllowed, c'est qu'iOS a bloqué
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             setHasPermission(false);
        } else {
             alert("Erreur technique : " + err.message);
        }
    }
  };

  // --- ECRAN DEMANDE PERMISSION ---
  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text as TextStyle}>Autorisation requise</Text>
        <Text style={styles.subText as TextStyle}>
            Cliquez sur le bouton ci-dessous pour activer le scanner.
        </Text>
        
        {/* ASTUCE CRUCIALE : On utilise une View avec onClick au lieu de TouchableOpacity onPress */}
        {/* React Native Web transforme ça en vrai <div> avec onclick, ce que Safari adore. */}
        <View 
            // @ts-ignore : onClick existe sur le Web mais n'est pas dans les types React Native
            onClick={handleRequestPermission}
            style={styles.realButton}
        >
            <Text style={styles.btnText as TextStyle}>ACTIVER LA CAMÉRA</Text>
        </View>

        {hasPermission === false && (
            <View style={styles.errorBox}>
                <Text style={styles.errorText as TextStyle}>⚠️ ACCÈS BLOQUÉ PAR IOS</Text>
                <Text style={styles.errorSubText as TextStyle}>
                    Safari refuse l'accès. Vous devez aller dans :
                    {"\n"}Réglages {'>'} Safari {'>'} Caméra
                    {"\n"}et choisir "Demander" ou "Autoriser".
                </Text>
            </View>
        )}
      </View>
    );
  }

  // --- ECRAN SCANNER ---
  return (
    <View style={styles.container}>
        <CameraView
            key={key}
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => {
                if (data) onScan(data);
            }}
        >
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
            </View>
        </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // @ts-ignore
    height: '100vh', 
    width: '100%',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
    // @ts-ignore
    height: '100vh',
    width: '100vw',
    position: 'absolute',
    zIndex: 9999, // On s'assure d'être au dessus de tout
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
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  subText: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 24
  },
  // Style bouton "pur" pour le web
  realButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    cursor: 'pointer', // Curseur main sur PC
    // @ts-ignore
    userSelect: 'none', // Evite de sélectionner le texte
    shadowColor: "#1e90ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  } as ViewStyle,
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  errorBox: {
    marginTop: 40,
    padding: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4444'
  },
  errorText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10
  },
  errorSubText: {
    color: '#ffaaaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  hint: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    fontWeight: '600'
  }
});