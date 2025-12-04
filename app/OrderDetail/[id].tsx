import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import supabase from "../../lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";

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

// Composant cross-platform pour WebView / iframe
const CrossPlatformWebView = ({ uri }: { uri: string }) => {
  if (Platform.OS === "web") {
    return (
      <iframe
        src={uri}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    );
  }

  return (
    <WebView
      source={{ uri }}
      style={{ flex: 1 }}
      startInLoadingState
      renderLoading={() => (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text>Chargement du PDF...</Text>
        </View>
      )}
    />
  );
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="inbox" size={64} color="#CBD5E1" />
        <Text style={styles.emptyText}>Aucune commande trouvée</Text>
      </View>
    );
  }

  const pdfUrl = `http://localhost:3001/pdf-proxy/${order.order_number}`;



  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Commande</Text>
            <Text style={styles.headerTitle}>#{order.order_number}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Client */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="person" size={20} color="#4A90E2" />
            </View>
            <Text style={styles.cardTitle}>Informations client</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.clientName}>
              {order.first_name} {order.last_name}
            </Text>
          </View>
        </View>

        {/* Card Date */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="event" size={20} color="#4A90E2" />
            </View>
            <Text style={styles.cardTitle}>Date de commande</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.dateText}>
              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.timeText}>
              {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        {/* Card Commentaire */}
        {order.comment && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="comment" size={20} color="#4A90E2" />
              </View>
              <Text style={styles.cardTitle}>Commentaire</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.commentText}>{order.comment}</Text>
            </View>
          </View>
        )}

        {/* Card Articles */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="shopping-cart" size={20} color="#4A90E2" />
            </View>
            <Text style={styles.cardTitle}>Articles</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{order.items.total_items}</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            {order.items.products.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.itemRow,
                  index !== order.items.products.length - 1 && styles.itemRowBorder
                ]}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.itemDot} />
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.designation}
                  </Text>
                </View>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>×{item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bouton PDF */}
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={() => setPdfVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pdfButtonGradient}
          >
            <MaterialIcons name="picture-as-pdf" size={24} color="#fff" />
            <Text style={styles.pdfText}>Voir le bon de commande</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal PDF */}
      <Modal visible={pdfVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.pdfHeader}
          >
            <TouchableOpacity
              onPress={() => setPdfVisible(false)}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pdfHeaderTitle}>Bon de commande</Text>
          </LinearGradient>

          {/* Composant cross-platform */}
          <CrossPlatformWebView uri={pdfUrl} />
        </View>
      </Modal>
    </View>
  );
}

// Styles inchangés
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F1F5F9" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748B", fontWeight: "500" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },
  emptyText: { marginTop: 16, fontSize: 18, color: "#64748B", fontWeight: "500" },
  headerGradient: { paddingTop: 60, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  headerContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.2)", justifyContent: "center", alignItems: "center" },
  headerTextContainer: { marginLeft: 16, flex: 1 },
  headerSubtitle: { fontSize: 14, color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff", marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  card: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", flex: 1 },
  badge: { backgroundColor: "#4A90E2", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  cardContent: { padding: 16 },
  clientName: { fontSize: 18, fontWeight: "600", color: "#1E293B" },
  dateText: { fontSize: 16, color: "#1E293B", fontWeight: "500", textTransform: "capitalize" },
  timeText: { fontSize: 14, color: "#64748B", marginTop: 4, fontWeight: "500" },
  commentText: { fontSize: 15, color: "#475569", lineHeight: 22 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4A90E2", marginRight: 12 },
  itemName: { fontSize: 15, color: "#1E293B", flex: 1, fontWeight: "500" },
  quantityBadge: { backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quantityText: { fontSize: 14, color: "#4A90E2", fontWeight: "700" },
  pdfButton: { marginTop: 8, marginBottom: 20, borderRadius: 16, overflow: "hidden", shadowColor: "#4A90E2", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  pdfButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 18 },
  pdfText: { color: "#fff", fontWeight: "700", fontSize: 17, marginLeft: 12 },
  pdfHeader: { height: 100, flexDirection: "row", alignItems: "center", paddingTop: 50, paddingHorizontal: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.2)", justifyContent: "center", alignItems: "center" },
  pdfHeaderTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 16 },
});
