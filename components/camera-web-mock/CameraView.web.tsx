import React, { ComponentProps } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// Mock pour CameraView : affiche un message et un lien pour une URL HTTPS
export function CameraView({ style, onBarcodeScanned, ...props }: ComponentProps<any>) {
  return (
    <View style={[styles.cameraContainer, style]}>
      <MaterialIcons name="camera-alt" size={80} color="#888" />
      <Text style={styles.cameraText}>
        Le scan de QR Code est pas optimisé en version web.
      </Text>
      <TouchableOpacity
        onPress={() => Linking.openURL('https://web.dev/articles/user-activation')}
        style={styles.cameraLink}
      >
        <Text style={styles.cameraLinkText}>En savoir plus sur les APIs natives web</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraText: {
    color: "#555",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center"
  },
  cameraLink: {
    marginTop: 15,
  },
  cameraLinkText: {
    color: "#4A90E2",
    fontSize: 14,
    textDecorationLine: "underline"
  }
});