// app/_layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Toast from "react-native-toast-message";
import Head from 'expo-router/head';

// Composant client pour gérer les redirections après le montage
function RootNavigator() {
  const { isLoggedIn, isAdmin, isLoading } = useAuth(); // <--- On récupère isLoading
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Si l'app n'est pas montée OU qu'on charge encore la session, on attend
    if (!mounted || isLoading) return;

    if (!isLoggedIn) {
      router.replace("/(auth)/login" as any);
      return;
    }

    if (isAdmin) {
      router.replace("/(back)/commandes" as any);
      return;
    }

    router.replace("/(tabs)" as any);
  }, [isLoggedIn, isAdmin, router, mounted, isLoading]);

  if (isLoading) return null; 

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Head>
          <title>ETN App</title>
          <meta name="description" content="Application ETN" />
          <meta name="theme-color" content="#4A90E2" />
          
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />
          
          <link rel="icon" type="image/png" sizes="32x32" href="/icon-app.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-app.png" />
          <link rel="shortcut icon" href="/icon-app.png" />
          
          <link rel="manifest" href="/manifest.json" />
        </Head>

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(back)" />
        </Stack>

        <RootNavigator />

        <Toast />
      </CartProvider>
    </AuthProvider>
  );
}