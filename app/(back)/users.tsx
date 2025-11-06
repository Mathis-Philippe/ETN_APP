import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import supabase from "../../lib/supabase";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width - 40;

export default function UsersBack() {
  const [users, setUsers] = useState<any[]>([]);
  const [loginData, setLoginData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserOrders, setSelectedUserOrders] = useState<any[]>([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [sortOption, setSortOption] = useState<"recent" | "alphabet" | "mostActive">("recent");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // ---------------- Fetch utilisateurs et logins ----------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: clientsData, error: clientsError } = await supabase.from("clients").select("*");
      if (clientsError) console.error("Erreur récupération utilisateurs :", clientsError);
      setUsers(clientsData || []);

      const { data: loginsFetched, error: loginsError } = await supabase.from("logins").select("*");
      if (loginsError) console.error("Erreur récupération logins :", loginsError);
      setLoginData(loginsFetched || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  // ---------------- Filtrage et tri ----------------
  let filteredUsers = users.filter((u) =>
    u.nom.toLowerCase().includes(searchName.toLowerCase())
  );

  filteredUsers = filteredUsers.sort((a, b) => {
    if (sortOption === "alphabet") return a.nom.localeCompare(b.nom);
    if (sortOption === "recent") {
      const dateA = a.last_login ? new Date(a.last_login) : new Date(0);
      const dateB = b.last_login ? new Date(b.last_login) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    }
    if (sortOption === "mostActive") {
      const countA = a.orders_count || 0;
      const countB = b.orders_count || 0;
      return countB - countA;
    }
    return 0;
  });

  // ---------------- Statistiques ----------------
  const activeUsersByDay: Record<string, number> = {};

  loginData.forEach((login) => {
    // On utilise la colonne `date` si elle existe
    const loginDate = login.date ? new Date(login.date) : new Date(login.created_at);
    if (isNaN(loginDate.getTime())) return;

    // Format JJ/MM
    const dayMonth = loginDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });

    activeUsersByDay[dayMonth] = (activeUsersByDay[dayMonth] || 0) + 1;
  });

  // Trier les dates du plus ancien au plus récent
  const dates = Object.keys(activeUsersByDay).sort((a, b) => {
    const [dayA, monthA] = a.split("/").map(Number);
    const [dayB, monthB] = b.split("/").map(Number);
    return new Date(2025, monthA - 1, dayA).getTime() - new Date(2025, monthB - 1, dayB).getTime();
  });

  const activeCounts = dates.map((d) => activeUsersByDay[d]);

  // ---------------- View commandes utilisateur ----------------
  const viewUserOrders = async (user: any) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("client_id", user.code_client)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération commandes :", error);
      return;
    }

    setSelectedUserOrders(data || []);
    setSelectedUserName(user.nom);
    setModalVisible(true);
  };

  return (
    <>
      <FlatList
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>👥 Gestion des utilisateurs</Text>

            {/* Recherche */}
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par nom"
                placeholderTextColor="#666"
                value={searchName}
                onChangeText={setSearchName}
              />
            </View>

            {/* Tri */}
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontWeight: "600", marginBottom: 5 }}>Trier les utilisateurs :</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setDropdownVisible(!dropdownVisible)}
              >
                <Text style={{ color: "#000" }}>
                  {sortOption === "recent"
                    ? "Dernière connexion"
                    : sortOption === "alphabet"
                    ? "Alphabétique"
                    : "Plus actifs"}
                </Text>
              </TouchableOpacity>

              {dropdownVisible && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSortOption("recent");
                      setDropdownVisible(false);
                    }}
                  >
                    <Text>Dernière connexion</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSortOption("alphabet");
                      setDropdownVisible(false);
                    }}
                  >
                    <Text>Alphabétique</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSortOption("mostActive");
                      setDropdownVisible(false);
                    }}
                  >
                    <Text>Plus actifs</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Statistiques */}
            <Text style={styles.subtitle}>📊 Connexions récentes</Text>
            <View style={styles.chartCard}>
              {dates.length > 0 ? (
                <LineChart
                  data={{
                    labels: dates,
                    datasets: [{ data: activeCounts }],
                  }}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={chartConfig}
                  style={{ borderRadius: 10 }}
                />
              ) : (
                <Text style={{ textAlign: "center", padding: 20 }}>Aucune connexion enregistrée</Text>
              )}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text style={styles.bold}>
              {item.nom} {item.prenom || ""}
            </Text>
            <Text>Code client : {item.code_client}</Text>
            <Text>Rôle : {item.role}</Text>
            <Text>Ville : {item.ville}</Text>
            <Text>
              Dernière connexion :{" "}
              {item.last_login
                ? new Date(item.last_login + "Z").toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
                : "Jamais"}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => viewUserOrders(item)}
              >
                <Text style={styles.actionText}>Voir commandes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 20 }}
      />

      {/* Modal commandes utilisateur */}
      {modalVisible && (
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Commandes de {selectedUserName}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtn}>✖</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={selectedUserOrders}
                keyExtractor={(order) => order.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.orderCard}>
                    <Text style={styles.orderNumber}>Commande #{item.order_number}</Text>
                    <Text style={styles.orderDate}>
                      Date : {new Date(item.created_at).toLocaleString("fr-FR")}
                    </Text>
                    <Text style={styles.orderComment}>
                      Commentaire : {item.comment || "-"}
                    </Text>

                    {item.items && item.items.length > 0 && (
                      <View style={styles.orderItems}>
                        <Text style={styles.itemsTitle}>Articles :</Text>
                        {item.items.map((i: any, idx: number) => (
                          <Text key={idx} style={styles.itemText}>
                            • {i.designation} × {i.quantite} {i.prix ? `(${i.prix} €)` : ""}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(30, 144, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
  strokeWidth: 2,
};

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },
  chartCard: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 20, shadowOpacity: 0.1, shadowRadius: 5 },
  userCard: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 10, shadowOpacity: 0.1, shadowRadius: 3 },
  bold: { fontWeight: "700", marginBottom: 5 },
  actions: { flexDirection: "row", marginTop: 10 },
  actionBtn: { backgroundColor: "#4A90E2", padding: 8, borderRadius: 6, marginRight: 10 },
  actionText: { color: "#fff", fontWeight: "600" },
  searchBar: { marginBottom: 15 },
  searchInput: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", fontSize: 16, color: "#000" },
  dropdownBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  dropdownMenu: { position: "absolute", backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, width: "100%", marginTop: 45, zIndex: 1000 },
  dropdownItem: { padding: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 15 },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 15, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  closeBtn: { fontSize: 20, color: "#E63946", fontWeight: "700" },
  orderCard: { backgroundColor: "#f9f9f9", padding: 12, borderRadius: 10, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  orderNumber: { fontWeight: "700", marginBottom: 4 },
  orderDate: { fontSize: 14, color: "#555", marginBottom: 4 },
  orderComment: { fontStyle: "italic", marginBottom: 6 },
  orderItems: { marginTop: 6 },
  itemsTitle: { fontWeight: "600", marginBottom: 2 },
  itemText: { fontSize: 14, marginLeft: 6 },
});
