import { useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

export default function QrScanner({ onScan }: { onScan: (data: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let stopStream: (() => void) | null = null;

    if (videoRef.current) {
      reader
        .decodeFromVideoDevice(
          undefined,      // auto-select camera
          videoRef.current,
          (result, error, controls) => {
            if (result) {
              onScan(result.getText());
            }

            // controls permet de stopper le flux
            if (!stopStream && controls) {
              stopStream = () => controls.stop();
            }
          }
        )
        .catch(console.error);
    }

    return () => {
      if (stopStream) stopStream(); // coupe le flux proprement
    };
  }, []);

  return ( 
    <div style={{ display: "flex", justifyContent: "center" }}>
      <video ref={videoRef} style={{ width: "100%", maxWidth: 400 }} autoPlay />
    </div>
  );
}
