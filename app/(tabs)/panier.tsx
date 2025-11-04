import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import supabase from "../../lib/supabase";

export default function CartScreen() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const { client } = useAuth();
  const router = useRouter();

  // États pour les modales
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>("1");

  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Suppression article ---
  const confirmRemove = (id: string) => {
    Alert.alert("Supprimer l'article", "Voulez-vous vraiment supprimer cet article du panier ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => removeFromCart(id) },
    ]);
  };

  // --- Vider le panier ---
  const confirmClearCart = () => {
    Alert.alert("Vider le panier", "Voulez-vous vraiment supprimer tous les articles ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Vider", style: "destructive", onPress: clearCart },
    ]);
  };

  // --- Édition quantité ---
  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setNewQuantity(item.quantite.toString());
    setModalVisible(true);
  };

  const handleSaveQuantity = () => {
    if (!selectedItem) return;
    const q = parseInt(newQuantity, 10);
    if (isNaN(q) || q <= 0) {
      Alert.alert("Quantité invalide");
      return;
    }
    updateQuantity(selectedItem.id, q);
    setModalVisible(false);
  };

  // --- Validation commande ---
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Votre panier est vide");
      return;
    }
    setCheckoutModalVisible(true);
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

    if (!response.ok) {
      const text = await response.text();
      console.error("Erreur serveur PDF:", text);
      Alert.alert("Erreur", "Impossible d’envoyer le PDF. Vérifie le serveur et l’URL.");
      setIsSubmitting(false);
      return;
    }

    const result = await response.json();
    if (result.error) {
      console.error("Erreur serveur PDF:", result.error);
      Alert.alert("Erreur", "Une erreur est survenue côté serveur.");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      client_id: client?.codeClient,
      first_name: firstName,
      last_name: lastName,
      order_number: orderNumber,
      comment: comment || null,
      items: {
        products: cart.map(item => ({
          code: item.code,
          designation: item.designation,
          quantity: item.quantite,
        })),
        total_items: cart.length,
      },
      created_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase.from("orders").insert([orderData]);
    if (dbError) throw dbError;

    clearCart();
    setCheckoutModalVisible(false);
    Alert.alert("Commande validée ✅", "La commande a été enregistrée et le PDF envoyé.");
  } catch (e) {
    console.error(e);
    Alert.alert("Erreur", "Impossible de valider la commande.");
  } finally {
    setIsSubmitting(false);
  }
};

  if (cart.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Votre panier est vide</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bouton vider panier */}
      <View style={styles.clearWrapper}>
        <TouchableOpacity style={styles.clearButton} onPress={confirmClearCart}>
          <MaterialIcons name="delete-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Liste articles */}
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <View style={styles.item}>
              <Text style={styles.title}>{item.designation}</Text>
              <Text style={styles.subtitle}>Réf : {item.code}</Text>
              <Text style={styles.subtitle}>Quantité : {item.quantite}</Text>
              <TouchableOpacity onPress={() => confirmRemove(item.id)}>
                <Text style={styles.remove}>❌ Supprimer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Modal édition quantité */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier la quantité</Text>
            <Text style={{ marginBottom: 10 }}>{selectedItem?.designation}</Text>
            <TextInput
              style={styles.input}
              value={newQuantity}
              onChangeText={setNewQuantity}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveQuantity}>
                <Text style={styles.saveText}>Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal validation commande */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Valider la commande</Text>
            <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor="#0000006c" value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Nom" placeholderTextColor="#0000006c" value={lastName} onChangeText={setLastName} />
            <TextInput style={styles.input} placeholder="Numéro de commande" placeholderTextColor="#0000006c" value={orderNumber} onChangeText={setOrderNumber} />
            <TextInput style={styles.input} placeholder="Commentaire (optionnel)" placeholderTextColor="#0000006c" value={comment} onChangeText={setComment} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleCheckout}>
                <Text style={styles.saveText}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setCheckoutModalVisible(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bouton principal */}
      <TouchableOpacity style={styles.checkoutButton} onPress={handleOpenCheckout}>
        <Text style={styles.checkoutText}>Valider la commande</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F7F9FC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { fontSize: 18, color: "#777" },
  clearWrapper: { alignItems: "flex-end", marginBottom: 10 },
  clearButton: { backgroundColor: "#dd2828", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  item: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  title: { fontSize: 18, fontWeight: "600", color: "#333" },
  subtitle: { fontSize: 14, color: "#666", marginVertical: 5 },
  remove: { color: "#E63946", marginTop: 5 },
  checkoutButton: { backgroundColor: "#4A90E2", padding: 18, borderRadius: 12, alignItems: "center", position: "absolute", bottom: 20, left: 20, right: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 16 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  saveButton: { backgroundColor: "#10B981", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelButton: { backgroundColor: "#9ca3afff", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  cancelText: { color: "#fff", fontWeight: "600" },
});
