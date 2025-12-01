// Mock pour useCameraPermissions : simule la permission accordée sur le web
import { useState } from "react";

export function useCameraPermissions() {
  const [permission] = useState({
    granted: true,
    status: "granted" as const,
    canAskAgain: false,
    expires: "never" as const,
  });

  const requestPermission = () => Promise.resolve(permission);

  // Le hook Expo retourne un tuple [permission, requestPermission]
  return [permission, requestPermission] as const;
}