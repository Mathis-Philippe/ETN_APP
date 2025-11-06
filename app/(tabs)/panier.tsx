import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import supabase from "../../lib/supabase";

export default function CartScreen() {
  const { cart, removeFromCart, clearCart, updateQuantity, addToCart } = useCart();
  const { client } = useAuth();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>("1");

  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectOrderModalVisible, setSelectOrderModalVisible] = useState(false);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);

  // --- Fonctions Panier ---
  const confirmRemove = (id: string) => {
    Alert.alert("Supprimer l'article", "Voulez-vous vraiment supprimer cet article du panier ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => removeFromCart(id) },
    ]);
  };

  const confirmClearCart = () => {
    Alert.alert("Vider le panier", "Voulez-vous vraiment supprimer tous les articles ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Vider", style: "destructive", onPress: clearCart },
    ]);
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setNewQuantity(item.quantite.toString());
    setModalVisible(true);
  };

  const handleSaveQuantity = () => {
    const q = parseInt(newQuantity, 10);
    if (isNaN(q) || q <= 0) return Alert.alert("Quantité invalide");
    updateQuantity(selectedItem.id, q);
    setModalVisible(false);
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return Alert.alert("Votre panier est vide");
    setCheckoutModalVisible(true);
  };

  const loadPreviousOrders = async () => {
    if (!client?.codeClient) return;

    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, created_at, items")
      .eq("client_id", client.codeClient)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération commandes :", error);
      return;
    }

    setPreviousOrders(data || []);
  };

  const handleCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!firstName || !lastName || !orderNumber) {
      Alert.alert("Tous les champs obligatoires doivent être remplis");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("https://cardiovascular-pitchier-duke.ngrok-free.dev/send-order-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          orderNumber,
          toEmail: "ton-email@gmail.com",
          cart,
          comment,
          clientCode: client?.codeClient,
        }),
      });

      if (!response.ok) throw new Error("Erreur envoi PDF");

      await supabase.from("orders").insert([{
        client_id: client?.codeClient,
        first_name: firstName,
        last_name: lastName,
        order_number: orderNumber,
        comment: comment || null,
        items: {
          products: cart.map((item) => ({
            code: item.code,
            designation: item.designation,
            quantity: item.quantite,
          })),
          total_items: cart.length,
        },
        created_at: new Date().toISOString(),
      }]);

      clearCart();
      setCheckoutModalVisible(false);
      Alert.alert("✅ Commande validée", "Elle a été enregistrée et envoyée.");

      // --- Important : recharger les commandes précédentes ---
      await loadPreviousOrders();

    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de valider la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const restoreOrder = (order: any) => {
    clearCart();
    order.items.products.forEach((p: any) =>
      addToCart({
        id: p.code,
        code: p.code,
        designation: p.designation,
        quantite: p.quantity,
      })
    );

    setFirstName("");
    setLastName("");
    setOrderNumber("");
    setComment("");
    
    setSelectOrderModalVisible(false);
    Alert.alert("✅ Panier mis à jour", "Commande rechargée !");
  };

  useEffect(() => {
    loadPreviousOrders();
  }, [client]);

  return (
    <View style={styles.container}>

      {cart.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={confirmClearCart}>
          <MaterialIcons name="delete-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {cart.length < 1 && (
        <Text style={styles.noArticleText}>Aucun article dans le panier</Text>
      )}

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <View style={styles.item}>
              <Text style={styles.title}>{item.designation}</Text>
              <Text style={styles.subtitle}>Réf : {item.code}</Text>
              <Text style={styles.subtitle}>Quantité : {item.quantite}</Text>
              <Text style={styles.remove} onPress={() => confirmRemove(item.id)}>❌ Supprimer</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {previousOrders.length > 0 && (
        <TouchableOpacity style={styles.reloadButton} onPress={async () => { await loadPreviousOrders(); setSelectOrderModalVisible(true); }}>
          <Text style={styles.reloadText}>Recharger une commande précédente</Text>
        </TouchableOpacity>
      )}

      {/* Modal sélection commandes */}
      <Modal visible={selectOrderModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une commande</Text>
            <FlatList
              data={previousOrders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => restoreOrder(item)}>
                  <Text style={styles.orderItem}>
                    #{item.order_number} — {new Date(item.created_at).toLocaleDateString("fr-FR")}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectOrderModalVisible(false)}>
              <Text style={styles.cancelText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {cart.length > 0 && (
        <TouchableOpacity style={styles.checkoutButton} onPress={handleOpenCheckout}>
          <Text style={styles.checkoutText}>Valider la commande</Text>
        </TouchableOpacity>
      )}

      {/* Modal édition quantité */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier quantité</Text>
            <TextInput style={styles.input} value={newQuantity} onChangeText={setNewQuantity} keyboardType="numeric" />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveQuantity}>
              <Text style={styles.saveText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal checkout */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Valider</Text>
            <TextInput style={styles.input} placeholder="Prénom" value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} />
            <TextInput style={styles.input} placeholder="Numéro commande" value={orderNumber} onChangeText={setOrderNumber} />
            <TextInput style={styles.input} placeholder="Commentaire (optionnel)" value={comment} onChangeText={setComment} />
            <TouchableOpacity style={styles.saveButton} onPress={handleCheckout}>
              <Text style={styles.saveText}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setCheckoutModalVisible(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC", padding: 20 },
  clearButton: { backgroundColor: "#dd2828", padding: 8, borderRadius: 20, alignSelf: "flex-end", marginBottom: 10 },
  item: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "600" },
  subtitle: { color: "#666" },
  remove: { color: "#E63946", marginTop: 8 },
  reloadButton: { padding: 12, backgroundColor: "#E9EDF5", borderRadius: 8, alignItems: "center", marginTop: 10 },
  reloadText: { color: "#333", fontWeight: "600" },
  checkoutButton: { backgroundColor: "#4A90E2", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 15 },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#CCC", padding: 10, borderRadius: 8, marginBottom: 10 },
  saveButton: { backgroundColor: "#10B981", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelButton: { backgroundColor: "#9CA3AF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  cancelText: { color: "#fff", fontWeight: "600" },
  orderItem: { padding: 12, borderBottomWidth: 1, borderColor: "#E5E7EB", fontSize: 16 },
  noArticleText: { textAlign: "center", fontSize: 16, color: "#666", marginTop: 250 },
});
