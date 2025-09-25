import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";

export default function CartScreen() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>("1");

  const confirmRemove = (id: string) => {
    Alert.alert(
      "Supprimer l'article",
      "Voulez-vous vraiment supprimer cet article du panier ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => removeFromCart(id) },
      ]
    );
  };

  const confirmClearCart = () => {
    Alert.alert(
      "Vider le panier",
      "Voulez-vous vraiment supprimer tous les articles ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Vider", style: "destructive", onPress: clearCart },
      ]
    );
  };

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

    if (q > selectedItem.stock) {
      Alert.alert(
        "Stock insuffisant",
        `Stock disponible : ${selectedItem.stock}`
      );
      return;
  }

    updateQuantity(selectedItem.id, q);
    setModalVisible(false);
  };

  if (cart.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>Votre panier est vide 🛒</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bouton pour vider le panier */}
      <View style={styles.clearWrapper}>
        <TouchableOpacity style={styles.clearButton} onPress={confirmClearCart}>
          <MaterialIcons name="delete-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Liste des articles */}
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
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bouton Valider la commande */}
      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={() => router.push("/checkout")}
      >
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
  clearButton: {
    backgroundColor: "#dd2828",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  item: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "600", color: "#333" },
  subtitle: { fontSize: 14, color: "#666", marginVertical: 5 },
  remove: { color: "#E63946", marginTop: 5 },

  checkoutButton: {
    backgroundColor: "#4A90E2",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    textAlign: "center",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelButton: {
    backgroundColor: "#9CA3AF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelText: { color: "#fff", fontWeight: "600" },
});
