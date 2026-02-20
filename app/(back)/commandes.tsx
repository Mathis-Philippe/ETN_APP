import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import supabase from "../../lib/supabase"; 
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Order = {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  order_number: string;
  created_at: string;
  clients: {
    nom: string; 
  } | null;
};

const AdminCommandesScreen: React.FC = () => {
  const { isAdmin } = useAuth(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAdmin) return; 

      setLoading(true);
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          clients (nom) 
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur récupération commandes:", error.message);
      } else {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    if (isAdmin) {
        fetchOrders();
    }
  }, [isAdmin]);

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    const companyName = order.clients?.nom?.toLowerCase() || ''; 

    return (
      companyName.includes(term) ||
      order.first_name.toLowerCase().includes(term) ||
      order.last_name.toLowerCase().includes(term) ||
      order.order_number.includes(term) ||
      order.client_id.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <ActivityIndicator style={styles.centered} size="large" color="#4A90E2" />
    );
  }

  if (!isAdmin) {
      return (
        <View style={styles.centered}>
            <Text style={styles.emptyText}>Accès refusé. Vous devez être administrateur pour voir ce tableau de bord.</Text>
        </View>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de Bord Commandes</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par société, client ou numéro de commande..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const date = new Date(item.created_at);

          const formattedDate = date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
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
                    <Text style={styles.label}>Société</Text>
                    <Text style={styles.value}>{item.clients?.nom || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Contact</Text>
                    <Text style={styles.value}>
                      {item.first_name} {item.last_name}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Code Client</Text>
                    <Text style={styles.value}>{item.client_id}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading && <Text style={styles.emptyText}>Aucune commande trouvée correspondant à la recherche.</Text>}
      />
    </View>
  );
};

export default AdminCommandesScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC", 
    paddingTop: 20 
  },

  header: { 
    alignItems: "center", 
    marginBottom: 20, 
    paddingHorizontal: 20 
  },

  title: { 
    fontSize: 28, 
    fontWeight: "700", 
    color: "#1E293B" 
  },

  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },

  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#F8FAFC" 
  },

  emptyText: { 
    fontSize: 16, 
    color: "#64748B", 
    fontWeight: "500", 
    textAlign: 'center',
    marginTop: 30 
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20, 
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1E293B',
  },
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
  orderHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 16 
  },

  orderNumberBadge: { 
    backgroundColor: "#EEF2FF", 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },

  orderNumberText: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#6d88ff" 
  },

  dateText: { 
    fontSize: 14, 
    color: "#64748B", 
    fontWeight: "500" 
  },

  divider: { 
    height: 1, 
    backgroundColor: "#E2E8F0", 
    marginBottom: 16 
  },

  orderDetails: { 
    gap: 12 
  },

  detailRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },

  label: { 
    fontSize: 14, 
    color: "#64748B", 
    fontWeight: "500" 
  },

  value: { 
    fontSize: 15, 
    color: "#1E293B", 
    fontWeight: "600" 
  }
});