import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import supabase from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ClientData = {
  codeClient: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  commercial: string;
  role?: "client" | "admin";
  last_login?: string | null;
  // password n'est pas stocké dans le contexte pour sécurité
};

type AuthContextType = {
  isLoggedIn: boolean;
  client: ClientData | null;
  error: string | null;
  loginWithQr: (data: string) => Promise<boolean>;
  loginWithPassword: (code: string, pass: string) => Promise<boolean>; // <--- NOUVEAU
  logout: () => void;
  setClient: React.Dispatch<React.SetStateAction<ClientData | null>>;
  isAdmin: boolean;
  loadingLogin: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------- Helpers ---------- */
const cleanString = (s: string | undefined) =>
  (s ?? "").replace(/\uFEFF/g, "").replace(/\u200B/g, "").trim();

function parseQrData(raw: string) {
  const data = cleanString(raw).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const codeClient =
    data
      .split("\n")
      .find((l) => l.toLowerCase().startsWith("code client"))
      ?.replace(/code client\s*:/i, "")
      .trim() ?? "";
  return { codeClient };
}

/* ---------- AuthProvider ---------- */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [client, setClient] = useState<ClientData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const storedClient = await AsyncStorage.getItem("etn_user_session");
      if (storedClient) {
        setClient(JSON.parse(storedClient));
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error("Erreur lecture session:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fonction utilitaire pour finaliser la connexion (DRY) ---
  const finalizeLogin = async (clientData: any) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // Update last_login
    await supabase
      .from("clients")
      .update({ last_login: now.toISOString() })
      .eq("code_client", clientData.code_client);

    // Log connexion
    await supabase
      .from("logins")
      .upsert(
        { client_id: clientData.code_client, date: today },
        { onConflict: "client_id,date" }
      );

    const newClientData: ClientData = {
      codeClient: clientData.code_client,
      nom: clientData.nom,
      adresse: clientData.adresse,
      code_postal: clientData.code_postal,
      ville: clientData.ville,
      commercial: clientData.commercial,
      role: clientData.role ?? "client",
      last_login: now.toISOString(),
    };

    setClient(newClientData);
    setIsLoggedIn(true);
    await AsyncStorage.setItem("etn_user_session", JSON.stringify(newClientData));
  };

  // 1. Connexion via QR Code (Sans mot de passe, basé sur la possession physique du QR)
  const loginWithQr = async (qrData: string) => {
    if (loadingLogin) return false;
    setLoadingLogin(true);
    setError(null);

    try {
      if (!qrData || typeof qrData !== "string" || qrData.trim().length === 0) {
        setError("QR vide ou illisible");
        return false;
      }

      const { codeClient } = parseQrData(qrData);
      const normalizedCode = codeClient?.toUpperCase().trim();
      
      if (!normalizedCode) {
        setError("Code client introuvable dans le QR");
        return false;
      }

      const { data: clientData, error: dbError } = await supabase
        .from("clients")
        .select("*")
        .eq("code_client", normalizedCode)
        .single();

      if (dbError || !clientData) {
        setError(`Code client ${normalizedCode} non reconnu ❌`);
        return false;
      }

      await finalizeLogin(clientData);
      return true;
    } catch (err) {
      console.error("Erreur loginWithQr :", err);
      setError("Erreur lors de la connexion");
      return false;
    } finally {
      setLoadingLogin(false);
    }
  };

  // 2. Connexion Manuelle (AVEC Mot de passe)
  const loginWithPassword = async (code: string, pass: string) => {
    if (loadingLogin) return false;
    setLoadingLogin(true);
    setError(null);

    try {
      const normalizedCode = code.toUpperCase().trim();
      
      // On récupère le client ET son mot de passe
      const { data: clientData, error: dbError } = await supabase
        .from("clients")
        .select("*")
        .eq("code_client", normalizedCode)
        .single();

      if (dbError || !clientData) {
        setError("Identifiants incorrects"); // On reste vague par sécurité
        return false;
      }

      // VÉRIFICATION DU MOT DE PASSE
      // Note: Idéalement, utilisez le hachage, mais ici on compare le texte brut stocké
      if (!clientData.password || clientData.password !== pass) {
        setError("Mot de passe incorrect");
        return false;
      }

      await finalizeLogin(clientData);
      return true;
    } catch (err) {
      console.error("Erreur loginWithPassword :", err);
      setError("Erreur connexion");
      return false;
    } finally {
      setLoadingLogin(false);
    }
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setClient(null);
    setError(null);
    try {
      await AsyncStorage.removeItem("etn_user_session");
    } catch (e) {
      console.error("Erreur logout:", e);
    }
  };

  const isAdmin = client?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, client, error, loginWithQr, loginWithPassword, logout, setClient, isAdmin, loadingLogin, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};