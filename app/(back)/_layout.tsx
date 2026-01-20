import { Tabs, Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function BackLayout() {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const router = useRouter();

  // 🔐 Sécurité : si non admin, on renvoie à l’accueil
  if (!isLoggedIn || !isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  // Fonction de déconnexion
  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive", 
          onPress: async () => {
            await logout();
            router.replace("/");
          }
        }
      ]
    );
  };

  return (
    <Tabs
      initialRouteName="commandes"
      screenOptions={{
        tabBarActiveTintColor: "#1e90ff",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 6,
        },
        headerTitle: () => (
          <Image
            source={require("../../assets/images/etn.png")}
            style={{ width: 120, height: 100, resizeMode: "contain" }}
          />
        ),
        // --- AJOUT DU BOUTON DÉCONNEXION ICI ---
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 20 }}>
            <Ionicons name="log-out-outline" size={28} color="#E63946" />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 4,
          height: 120,
        },
        headerTitleAlign: "center",
      }}
    >
      <Tabs.Screen
        name="commandes"
        options={{
          title: "Commandes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Statistiques",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Utilisateurs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}