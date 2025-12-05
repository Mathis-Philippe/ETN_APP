import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import supabase from "../../lib/supabase";
import Toast from "react-native-toast-message"; // Assurez-vous que cet import est là

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

  // États pour le modal de confirmation personnalisé (remplace Alert.alert)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");


  // Ouvre le modal de confirmation personnalisé
  const openConfirmModal = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    // Stocke l'action à exécuter (removeFromCart ou clearCart)
    setConfirmAction(() => action); 
    setConfirmModalVisible(true);
  };

  // Gère l'action de confirmation
  const handleConfirm = () => {
    if (confirmAction) {
        confirmAction();
    }
    setConfirmModalVisible(false);
    setConfirmAction(null);
  };

  // Gère l'annulation de la confirmation
  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmAction(null);
  };

  // --- Fonctions Panier ---
  const handleRemove = (id: string) => {
    openConfirmModal(
      "Supprimer l'article",
      "Voulez-vous vraiment supprimer cet article du panier ?",
      () => removeFromCart(id)
    );
  };

  const handleClearCart = () => {
    openConfirmModal(
      "Vider le panier",
      "Voulez-vous vraiment supprimer tous les articles ?",
      clearCart
    );
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setNewQuantity(item.quantite.toString());
    setModalVisible(true);
  };

  // MODIFIÉ: Utilise Toast.show au lieu de Alert.alert
  const handleSaveQuantity = () => {
    const q = parseInt(newQuantity, 10);
    if (isNaN(q) || q <= 0) {
        Toast.show({ type: "error", text1: "Quantité invalide" });
        return;
    }
    updateQuantity(selectedItem.id, q);
    setModalVisible(false);
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
        Toast.show({ type: "error", text1: "Votre panier est vide" });
        return;
    }
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

  // MODIFIÉ: Logique de soumission avec Toast.show et gestion plus claire des erreurs.
  const handleCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!firstName || !lastName || !orderNumber) {
      Toast.show({ type: "error", text1: "Champs obligatoires", text2: "Veuillez remplir Prénom, Nom et Numéro de commande." });
      setIsSubmitting(false);
      return;
    }

    try {
      // L'URL de base Ngrok est stockée dans le fichier .env
      const ngrokBaseUrl = "https://cardiovascular-pitchier-duke.ngrok-free.dev"; 
      
      const response = await fetch(`${ngrokBaseUrl}/send-order-pdf`, {
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
        const errorText = await response.text();
        // Lance une erreur plus descriptive en cas de réponse non OK du serveur
        throw new Error(`Erreur serveur (${response.status}): ${errorText}`); 
      }

      // 1. Enregistrement de la commande dans Supabase
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

      // 2. Succès
      clearCart();
      setCheckoutModalVisible(false);
      Toast.show({ type: "success", text1: "Commande validée ✅", text2: "Elle a été enregistrée et envoyée." });

      // 3. Rechargement des commandes
      await loadPreviousOrders();

    } catch (e) {
      console.error("❌ Erreur validation commande:", e);
      Toast.show({ type: "error", text1: "Erreur", text2: `Impossible de valider la commande. Vérifiez que votre serveur Express (Ngrok) est bien lancé.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // MODIFIÉ: Utilise Toast.show au lieu de Alert.alert
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
    Toast.show({ type: "info", text1: "Panier mis à jour ✅", text2: "Commande rechargée !" });
  };

  useEffect(() => {
    loadPreviousOrders();
  }, [client]);

  return (
    <View style={styles.container}>

      {cart.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
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
              {/* Utilise la nouvelle fonction de suppression */}
              <Text style={styles.remove} onPress={() => handleRemove(item.id)}>❌ Supprimer</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {previousOrders.length > 0 && (
        <TouchableOpacity style={styles.reloadButton} onPress={async () => { await loadPreviousOrders(); setSelectOrderModalVisible(true); }}>
          <Text style={styles.reloadText}>Recharger une commande précédente</Text>
        </TouchableOpacity>
      )}

      {/* Modal sélection commandes (inchangé) */}
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
        <TouchableOpacity style={styles.checkoutButton} onPress={handleOpenCheckout} disabled={isSubmitting}>
          <Text style={styles.checkoutText}>
            {isSubmitting ? "Envoi en cours..." : "Valider la commande"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal édition quantité (modifié pour Toast) */}
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

      {/* Modal checkout (modifié pour appeler handleCheckout) */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Valider</Text>
            <TextInput style={styles.input} placeholder="Prénom (Obligatoire)" value={firstName} placeholderTextColor="#00000063" onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Nom (Obligatoire)" value={lastName} placeholderTextColor="#00000063" onChangeText={setLastName} />
            <TextInput style={styles.input} placeholder="Numéro commande (Obligatoire)" value={orderNumber} placeholderTextColor="#00000063" onChangeText={setOrderNumber} />
            <TextInput style={styles.input} placeholder="Commentaire (optionnel)" value={comment} placeholderTextColor="#00000063" onChangeText={setComment} />
            {/* L'appel à handleCheckout était déjà correct, mais nous ajoutons le disabled */}
            <TouchableOpacity style={styles.saveButton} onPress={handleCheckout} disabled={isSubmitting}>
              <Text style={styles.saveText}>{isSubmitting ? "Envoi en cours..." : "Valider"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setCheckoutModalVisible(false)} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation générique pour supprimer/vider le panier */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{confirmTitle}</Text>
            <Text style={styles.confirmMessage}>{confirmMessage}</Text>
            <TouchableOpacity 
              // Utilise une couleur rouge pour l'action de suppression/vidage
              style={[styles.saveButton, { backgroundColor: "#E63946" }]} 
              onPress={handleConfirm}
            >
              <Text style={styles.saveText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelConfirm}>
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
  confirmMessage: { fontSize: 16, color: "#333", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#CCC", padding: 10, borderRadius: 8, marginBottom: 10 },
  saveButton: { backgroundColor: "#10B981", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelButton: { backgroundColor: "#9CA3AF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
  cancelText: { color: "#fff", fontWeight: "600" },
  orderItem: { padding: 12, borderBottomWidth: 1, borderColor: "#E5E7EB", fontSize: 16 },
  noArticleText: { textAlign: "center", fontSize: 16, color: "#666", marginTop: 250 },
});