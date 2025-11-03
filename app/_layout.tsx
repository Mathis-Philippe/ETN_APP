// app/_layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Toast from "react-native-toast-message";


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
      router.replace("/(auth)/login");
      return;
    }

    if (isAdmin) {
      router.replace("/(back)");
      return;
    }

    router.replace("/(tabs)");
  }, [isLoggedIn, isAdmin, router, mounted]);

  return null; // Ce composant ne rend rien
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        {/* Stack principal de l'application */}
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
