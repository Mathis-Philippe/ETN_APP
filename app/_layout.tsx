// app/_layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Toast from "react-native-toast-message";
import Head from 'expo-router/head'; // Import important

// Composant client pour gérer les redirections après le montage
function RootNavigator() {
  const { isLoggedIn, isAdmin } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // On attend que le layout soit monté
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isLoggedIn) {
      router.replace("/(auth)/login" as any);
      return;
    }

    if (isAdmin) {
      router.replace("/(back)/commandes" as any);
      return;
    }

    router.replace("/(tabs)" as any);
  }, [isLoggedIn, isAdmin, router, mounted]);

  return null; // Ce composant ne rend rien
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        {/* --- DÉBUT MODIFICATION PWA --- */}
        <Head>
          <title>ETN App</title>
          <meta name="description" content="Application ETN" />
          <meta name="theme-color" content="#4A90E2" />
          
          {/* Pour iOS : On couvre les deux cas (standard et precomposed) */}
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />
          
          {/* Pour Android / Chrome */}
          <link rel="icon" type="image/png" sizes="32x32" href="/icon-app.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-app.png" />
          
          {/* Correction du Favicon 404 : Assurez-vous d'avoir copié favicon.png dans public/ */}
          <link rel="shortcut icon" href="/icon-app.png" />
          
          <link rel="manifest" href="/manifest.json" />
        </Head>

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(back)" />
        </Stack>

        {/* Gestion des redirections */}
        <RootNavigator />

        {/* Toast global */}
        <Toast />
      </CartProvider>
    </AuthProvider>
  );
}