import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import supabase from "../../lib/supabase";

export default function OrdersBack() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);

      // 1️⃣ Récupérer toutes les commandes
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Erreur chargement commandes:", ordersError);
        setLoading(false);
        return;
      }

      // 2️⃣ Récupérer tous les clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("code_client, nom, adresse, code_postal, ville");

      if (clientsError) {
        console.error("Erreur chargement clients:", clientsError);
        setLoading(false);
        return;
      }

      // 3️⃣ Associer chaque commande à son client via code_client
      const ordersWithClient = ordersData.map(o => {
        const client = clientsData.find(c => c.code_client === o.client_id);
        return { ...o, client };
      });

      setOrders(ordersWithClient);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  // Statistiques
  const totalClients = new Set(orders.map(o => o.client?.nom)).size;
  const totalOrders = orders.length;

  type Client = {
    code_client: string;
    nom: string;
    adresse: string;
    code_postal: string;
    ville: string;
  };

  type Order = {
    id: string;
    client_id: string;
    first_name: string;
    last_name: string;
    order_number: string;
    created_at: string;
    comment?: string;
    items?: { designation: string; quantite: number; prix?: number }[];
    client?: Client | null;
  };

  const groupedOrders: Record<string, Order[]> = orders.reduce((acc, order) => {
    const clientName = order.client?.nom || "—";
    if (!acc[clientName]) acc[clientName] = [];
    acc[clientName].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📦 Commandes</Text>

      {/* Statistiques */}
      <View style={styles.stats}>
        <Text>Total commandes : {totalOrders}</Text>
        <Text>Total clients : {totalClients}</Text>
      </View>

      {/* Liste groupée par client */}
      {Object.entries(groupedOrders).map(([clientName, clientOrders]) => (
        <View key={clientName} style={styles.clientBlock}>
          <Text style={styles.clientTitle}>{clientName}</Text>

          {clientOrders
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(order => (
              <View key={order.id} style={styles.card}>
                <Text style={styles.bold}>Commande #{order.order_number}</Text>
                <Text>Client : {order.first_name} {order.last_name}</Text>
                <Text>Adresse : {order.client?.adresse}, {order.client?.code_postal} {order.client?.ville}</Text>
                <Text>Date : {new Date(order.created_at).toLocaleString("fr-FR")}</Text>
                <Text>Commentaire : {order.comment || "—"}</Text>

                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsContainer}>
                    <Text style={styles.itemsTitle}>Articles commandés :</Text>
                    {order.items.map((i: any, idx: number) => (
                      <Text key={idx}>• {i.designation} × {i.quantite} {i.prix ? `(${i.prix} €)` : ""}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F7F9FC" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  stats: { marginBottom: 20 },
  clientBlock: { marginBottom: 25 },
  clientTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bold: { fontWeight: "700", marginBottom: 5 },
  itemsContainer: { marginTop: 10 },
  itemsTitle: { fontWeight: "600", marginBottom: 5 },
});
