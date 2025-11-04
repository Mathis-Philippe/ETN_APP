import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import supabase from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Order = {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  order_number: string;
  created_at: string; // timestamptz
};

const OrdersScreen: React.FC = () => {
  const { client } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!client) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", client.codeClient)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur récupération commandes:", error.message);
      } else {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [client]);

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Aucun client trouvé.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <ActivityIndicator style={styles.centered} size="large" color="#4A90E2" />
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Aucune commande trouvée pour ce client.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec bouton back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Mes Commandes</Text>
      </View>

      {/* Liste des commandes */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const date = new Date(item.created_at);

          const formattedDate = date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Europe/Paris",
          });

          const formattedTime = date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Paris",
          });

          return (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/OrderDetail/[id]",
                  params: { id: item.id },
                })
              }
            >
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderNumberBadge}>
                    <Text style={styles.orderNumberText}>
                      #{item.order_number}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{formattedDate}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Client</Text>
                    <Text style={styles.value}>
                      {item.first_name} {item.last_name}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Heure</Text>
                    <Text style={styles.value}>{formattedTime}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingTop: 100 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingHorizontal: 20 },
  backButton: { marginRight: 12 },
  title: { fontSize: 28, fontWeight: "700", color: "#1E293B" },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  emptyText: { fontSize: 16, color: "#64748B", fontWeight: "500" },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  orderNumberBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  orderNumberText: { fontSize: 16, fontWeight: "700", color: "#6d88ff" },
  dateText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginBottom: 16 },
  orderDetails: { gap: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  value: { fontSize: 15, color: "#1E293B", fontWeight: "600" },
});
