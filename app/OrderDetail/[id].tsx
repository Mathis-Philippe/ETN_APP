import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import supabase from "../../lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

type OrderItem = {
  code: string;
  designation: string;
  quantity: number;
};

type Order = {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  order_number: string;
  comment: string | null;
  items: {
    products: OrderItem[];
    total_items: number;
  };
  created_at: string;
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfVisible, setPdfVisible] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erreur récupération commande:", error);
      } else {
        setOrder(data as Order);
      }

      setLoading(false);
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#4A90E2"
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      />
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Aucune commande trouvée.</Text>
      </View>
    );
  }

  const pdfUrl = `https://cardiovascular-pitchier-duke.ngrok-free.dev/order-pdf/${order.order_number}`;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Commande #{order.order_number}</Text>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <Text>
            {order.first_name} {order.last_name}
          </Text>
        </View>

        {/* Date & Heure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Heure</Text>
          <Text>{new Date(order.created_at).toLocaleString("fr-FR")}</Text>
        </View>

        {/* Commentaire */}
        {order.comment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commentaire</Text>
            <Text>{order.comment}</Text>
          </View>
        )}

        {/* Articles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Articles ({order.items.total_items})
          </Text>
          {order.items.products.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text>{item.designation}</Text>
              <Text>Qté: {item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Bouton PDF */}
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={() => setPdfVisible(true)}
        >
          <Text style={styles.pdfText}>Voir le bon de commande (PDF)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal avec WebView */}
      <Modal visible={pdfVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <View style={styles.pdfHeader}>
            <TouchableOpacity
              onPress={() => setPdfVisible(false)}
              style={{ marginLeft: 10 }}
            >
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pdfHeaderTitle}>Bon de commande</Text>
          </View>
          <WebView
            source={{ uri: pdfUrl }}
            originWhitelist={["*"]}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator
                size="large"
                color="#4A90E2"
                style={{ flex: 1 }}
              />
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 80 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#1E293B" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  pdfButton: {
    backgroundColor: "#4A90E2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  pdfText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pdfHeader: {
    height: 100,
    backgroundColor: "#4A90E2",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
  },
  pdfHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 20,
  },
});
