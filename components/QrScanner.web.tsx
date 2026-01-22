import { View, StyleSheet, Text, Platform, ActivityIndicator } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

export default function QrScannerWeb({ onScan }: { onScan: (data: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // On garde une référence aux contrôles du scanner pour pouvoir l'arrêter proprement
  const controlsRef = useRef<IScannerControls | null>(null);
  const codeReader = useRef(new BrowserQRCodeReader());

  // --- 1. DÉMARRAGE MANUEL DE LA CAMÉRA ---
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      try {
        // CORRECTION IMPORTANTE : 
        // On ne définit PAS de width/height fixes (ex: 1280x720).
        // Cela force souvent Android à cropper l'image, ce qui désactive l'autofocus matériel.
        // On laisse le navigateur choisir la résolution native du capteur.
        const constraints: any = {
          video: { 
            facingMode: 'environment',
            // On demande le focus continu standard dès le début
            focusMode: 'continuous' 
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        activeStream = stream;

        // --- GESTION AVANCÉE DU FOCUS (Correctif Samsung/Android) ---
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        const settings = track.getSettings() as any;

        // Si le focus continu est supporté par le matériel...
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
             // ... et qu'il n'est pas déjà actif
             if (settings.focusMode !== 'continuous') {
                 try {
                    // On attend 500ms que le driver de la caméra se stabilise avant d'appliquer la contrainte.
                    // C'est souvent ce changement immédiat qui rendait l'image floue après 1s.
                    await new Promise(r => setTimeout(r, 500));
                    
                    if (isMounted && track.readyState === 'live') {
                        // @ts-ignore
                        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
                        console.log("Focus continu forcé avec succès.");
                    }
                 } catch (e) {
                    console.log("Le focus continu n'a pas pu être forcé (ce n'est pas grave) :", e);
                 }
             }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // On attend que la vidéo soit chargée pour lancer le scan
          videoRef.current.onloadedmetadata = () => {
             if (!isMounted) return;
             setLoading(false);
             videoRef.current?.play().catch(e => console.log("Play error", e));
             startScanning();
          };
        }
      } catch (err) {
        console.error("Erreur caméra :", err);
        if (isMounted) setLoading(false);
      }
    };

    startCamera();

    // NETTOYAGE À LA SORTIE DE L'ÉCRAN
    return () => {
      isMounted = false;
      // 1. Arrêter le scanner ZXing
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      // 2. Arrêter la caméra (éteindre la lumière verte)
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // --- 2. BOUCLE DE SCAN ---
  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      // On lance le scan et on récupère les "controls" pour pouvoir stopper plus tard
      const controls = await codeReader.current.decodeFromVideoElement(
        videoRef.current, 
        (result, error, controls) => {
          if (result) {
            controls.stop(); // Arrêt immédiat si trouvé
            onScan(result.getText());
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      console.log("Erreur initialisation scan:", err);
    }
  };

  // --- 3. GESTION PHOTO (FALLBACK) ---
  const handleFileChange = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      // Priorité Natif (BarcodeDetector sur Android récent/Chrome)
      // @ts-ignore
      if ('BarcodeDetector' in window) {
        try {
            // @ts-ignore
            const nativeDetector = new BarcodeDetector({ formats: ['qr_code'] });
            const nativeResults = await nativeDetector.detect(file);
            if (nativeResults.length > 0) { onScan(nativeResults[0].rawValue); return; }
        } catch (e) {}
      }
      
      // Fallback ZXing avec rotation de l'image
      const imgUrl = URL.createObjectURL(file);
      await processImageWithRotation(imgUrl);
      URL.revokeObjectURL(imgUrl);
    } catch (err) {
      alert("QR Code illisible. Essayez de reculer un peu.");
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processImageWithRotation = async (url: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Optimisation : On réduit la taille si l'image est géante (>1000px)
          const MAX_SIZE = 1000;
          let width = img.width;
          let height = img.height;
          if (width > height) {
             if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
             if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          const canvas = document.createElement('canvas');
          const maxDim = Math.max(width, height);
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error("Canvas erreur");

          // Test des 4 rotations pour être sûr de lire le code
          for (let angle of [0, 90, 180, 270]) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((angle * Math.PI) / 180);
            ctx.drawImage(img, -width / 2, -height / 2, width, height);
            ctx.restore();
            try {
              // Note: decodeFromCanvas n'utilise pas de callback, il retourne une promesse
              const result = await codeReader.current.decodeFromCanvas(canvas);
              if (result) { onScan(result.getText()); resolve(); return; }
            } catch (e) {}
          }
          reject("Rien trouvé");
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject("Erreur image");
      img.src = url;
    });
  };

  const triggerNativeCamera = () => { fileInputRef.current?.click(); };

  return (
    <View style={styles.container}>
      {/* Video HTML brute */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', overflow: 'hidden', backgroundColor: '#000' }}>
        <video
          ref={videoRef}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', // Remplit l'écran sans déformer
          }}
          muted
          playsInline
        />
      </div>

      <View style={styles.overlay}>
        {loading && (
             <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Caméra...</Text>
            </View>
        )}

        <View style={styles.scanFrame} />
        
        {analyzing && (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Lecture...</Text>
            </View>
        )}

        <View style={styles.bottomControls}>
            <Text style={styles.hintText}>Si le scanner est flou :</Text>
            
            {/* Input caché pour le fallback photo */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            
            {/* Bouton visible */}
            <View 
                // @ts-ignore
                onClick={triggerNativeCamera}
                style={styles.photoButton as any}
            >
                <Text style={styles.photoButtonText}>📸 PRENDRE UNE PHOTO</Text>
            </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    // @ts-ignore
    height: Platform.OS === 'web' ? '100vh' : '100%',
    width: '100%',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    marginBottom: 100,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
    bottom: 100,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3
  },
  photoButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    bottom: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginTop: 10,
    ...Platform.select({ web: { cursor: 'pointer', userSelect: 'none' } })
  },
  photoButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: { color: 'white', marginTop: 10, fontWeight: 'bold' }
});