// app/_layout.tsx
import React from "react";
import { Stack, Redirect } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext"; 
import Toast from "react-native-toast-message";

function RootNavigator() {
  const { isLoggedIn } = useAuth();

  // redirige en fonction de l'état d'auth
  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* RootNavigator doit être en-dehors du <Stack> */}
      <RootNavigator />

      {/* Toast global pour messages non bloquants */}
      <Toast />
      </CartProvider>
    </AuthProvider>
  );
}
