import React, { createContext, ReactNode, useContext, useState } from "react";
import supabase  from "../lib/supabase";

type ClientData = {
  codeClient: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  commercial: string;
};

type AuthContextType = {
  isLoggedIn: boolean;
  client: ClientData | null;
  error: string | null;
  loginWithQr: (data: string) => Promise<boolean>;
  logout: () => void;
  setClient: React.Dispatch<React.SetStateAction<ClientData | null>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------- Helpers ---------- */

const cleanString = (s: string | undefined) =>
  (s ?? "").replace(/\uFEFF/g, "").replace(/\u200B/g, "").trim();

function parseQrData(raw: string) {
  const data = cleanString(raw).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // récupère le "Code client: XXXX"
  const codeClient =
    data
      .split("\n")
      .find((l) => l.toLowerCase().startsWith("code client")) // ligne qui commence par Code client
      ?.replace(/code client\s*:/i, "")
      .trim() ?? "";

  return { codeClient };
}

/* ---------- AuthProvider ---------- */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [client, setClient] = useState<ClientData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginWithQr = async (qrData: string) => {
    setError(null);

    if (!qrData || typeof qrData !== "string" || qrData.trim().length === 0) {
      setError("QR vide ou illisible");
      return false;
    }

    const { codeClient } = parseQrData(qrData);
    const normalizedCode = codeClient ? codeClient.toUpperCase().trim() : "";

    if (!normalizedCode) {
      setError("Code client introuvable dans le QR");
      return false;
    }

    // 🔎 Vérifier dans Supabase
    const { data, error: dbError } = await supabase
      .from("clients") // ⚡ ta table dans Supabase
      .select("*")
      .eq("code_client", normalizedCode) // la colonne dans Supabase
      .single();

    if (dbError || !data) {
      setError(`Code client ${normalizedCode} non reconnu ❌`);
      return false;
    }

    // ✅ Connexion réussie
    setClient({
      codeClient: data.code_client,
      nom: data.nom,
      adresse: data.adresse,
      code_postal: data.code_postal,
      ville: data.ville,
      commercial: data.commercial,
    });
    setIsLoggedIn(true);
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setClient(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, client, error, loginWithQr, logout, setClient }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
