import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { MaterialIcons , MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import supabase from "../../lib/supabase";
import Toast from "react-native-toast-message";

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

  // États confirmation
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  const openConfirmModal = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action); 
    setConfirmModalVisible(true);
  };

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    setConfirmModalVisible(false);
    setConfirmAction(null);
  };

  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmAction(null);
  };

  // --- Fonctions Panier ---
  const handleRemove = (id: string) => {
    openConfirmModal("Supprimer l'article", "Voulez-vous vraiment supprimer cet article ?", () => removeFromCart(id));
  };

  const handleClearCart = () => {
    openConfirmModal("Vider le panier", "Voulez-vous vraiment supprimer tous les articles ?", clearCart);
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setNewQuantity(item.quantite.toString());
    setModalVisible(true);
  };

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

    if (error) return;
    setPreviousOrders(data || []);
  };

  const handleCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!firstName || !lastName || !orderNumber) {
      Toast.show({ type: "error", text1: "Champs obligatoires", text2: "Prénom, Nom et Numéro requis." });
      setIsSubmitting(false);
      return;
    }

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://etn-app.onrender.com";
      
      const response = await fetch(`${API_URL}/send-order-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          orderNumber,
          toEmail: "mathis.philippe2005@gmail.com",
          cart,
          comment,
          clientCode: client?.codeClient,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur (${response.status}): ${errorText}`); 
      }

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
      Toast.show({ type: "success", text1: "Commande validée ✅", text2: "Envoyée par email." });
      await loadPreviousOrders();

    } catch (e) {
      console.error("❌ Erreur validation:", e);
      Toast.show({ type: "error", text1: "Erreur", text2: `Impossible de valider.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const restoreOrder = (order: any) => {
    clearCart();
    order.items.products.forEach((p: any) =>
      addToCart({ id: p.code, code: p.code, designation: p.designation, quantite: p.quantity })
    );
    setFirstName(""); setLastName(""); setOrderNumber(""); setComment("");
    setSelectOrderModalVisible(false);
    Toast.show({ type: "info", text1: "Panier restauré" });
  };

  useEffect(() => {
    loadPreviousOrders();
  }, [client]);

  return (
    <View style={styles.container}>

      {/* Header Panier : Titre ou Bouton Vider */}
      <View style={styles.headerContainer}>
        {cart.length > 0 ? (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
            <MaterialIcons name="delete-outline" size={20} color="#fff" />
            <Text style={{color:'#fff', marginLeft:5, fontWeight:'600'}}>Tout supprimer</Text>
            </TouchableOpacity>
        ) : null}
      </View>

      {/* Contenu principal (Liste) */}
      <View style={styles.listContainer}>
          {cart.length < 1 && (
            <View style={styles.emptyContainer}>
                <MaterialIcons name="shopping-cart" size={64} color="#DDD" />
                <Text style={styles.noArticleText}>Votre panier est vide</Text>
            </View>
          )}

          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            // On laisse de l'espace en bas pour que le dernier item ne soit pas caché par le footer fixe
            contentContainerStyle={{ paddingBottom: 200, paddingTop: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <View style={styles.item}>
                  <Text style={styles.title}>{item.designation}</Text>
                  <Text style={styles.subtitle}>Réf : {item.code}</Text>
                  <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:5}}>
                     <Text style={[styles.subtitle, {color:'#4A90E2', fontWeight:'bold'}]}>x {item.quantite}</Text>
                     <Text style={styles.remove} onPress={() => handleRemove(item.id)}>Supprimer</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
      </View>

      {/* --- ZONE BOUTONS FIXES (BAS DE PAGE) --- */}
      {/* Position absolute pour garantir l'affichage par dessus tout */}
      <View style={styles.footerButtons}>
        
        {/* Bouton Scanner (Toujours visible) */}
        <TouchableOpacity 
            style={styles.scanMoreButton} 
            onPress={() => router.push("/(tabs)")}
        >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#4A90E2" />
            <Text style={styles.scanMoreText}>Scanner un article</Text>
        </TouchableOpacity>

        {/* Bouton Historique */}
        {previousOrders.length > 0 && (
            <TouchableOpacity style={styles.reloadButton} onPress={async () => { await loadPreviousOrders(); setSelectOrderModalVisible(true); }}>
            <Text style={styles.reloadText}>Historique commandes</Text>
            </TouchableOpacity>
        )}

        {/* Bouton Valider (Seulement si articles) */}
        {cart.length > 0 && (
            <TouchableOpacity style={styles.checkoutButton} onPress={handleOpenCheckout} disabled={isSubmitting}>
            <Text style={styles.checkoutText}>
                {isSubmitting ? "Envoi..." : `Valider (${cart.length} articles)`}
            </Text>
            </TouchableOpacity>
        )}
      </View>


      {/* --- MODAL DE SÉLECTION DE COMMANDE --- */}
      <Modal visible={selectOrderModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historique</Text>
              <TouchableOpacity onPress={() => setSelectOrderModalVisible(false)} style={styles.closeIconButton}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Appuyez pour restaurer un panier.</Text>

            <FlatList
              data={previousOrders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const productCount = item.items?.total_items || item.items?.products?.length || 0;
                return (
                  <TouchableOpacity style={styles.orderCard} onPress={() => restoreOrder(item)}>
                    <View style={styles.orderCardHeader}>
                      <View style={styles.orderNumberContainer}>
                        <Text style={styles.orderNumberText}>#{item.order_number}</Text>
                      </View>
                      <Text style={styles.orderDateText}>
                        {new Date(item.created_at).toLocaleDateString("fr-FR")}
                      </Text>
                    </View>
                    <View style={styles.orderCardBody}>
                        <Text style={styles.orderInfoText}>{productCount} article(s)</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Quantité */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleOld}>Modifier quantité</Text>
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

      {/* Modal Checkout */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleOld}>Validation</Text>
            <TextInput style={styles.input} placeholder="Prénom" value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} />
            <TextInput style={styles.input} placeholder="N° Commande" value={orderNumber} onChangeText={setOrderNumber} />
            <TextInput style={styles.input} placeholder="Commentaire" value={comment} onChangeText={setComment} />
            
            <TouchableOpacity style={styles.saveButton} onPress={handleCheckout} disabled={isSubmitting}>
              <Text style={styles.saveText}>{isSubmitting ? "Envoi..." : "Envoyer commande"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setCheckoutModalVisible(false)} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmation */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleOld}>{confirmTitle}</Text>
            <Text style={styles.confirmMessage}>{confirmMessage}</Text>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: "#E63946" }]} onPress={handleConfirm}>
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
  container: { flex: 1, backgroundColor: "#F7F9FC" },
  headerContainer: { paddingHorizontal: 20, paddingTop: 20 },
  listContainer: { flex: 1, paddingHorizontal: 20 },
  
  clearButton: { flexDirection:'row', backgroundColor: "#E63946", padding: 8, paddingHorizontal:12, borderRadius: 20, alignSelf: "flex-end", marginBottom: 5, alignItems:'center' },
  
  emptyContainer: { alignItems:'center', justifyContent:'center', marginTop: 100 },
  noArticleText: { fontSize: 18, color: "#999", marginTop: 10, fontWeight:'500' },

  item: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:5, elevation:2 },
  title: { fontSize: 16, fontWeight: "600", color:'#333' },
  subtitle: { color: "#666", fontSize:14 },
  remove: { color: "#E63946", fontWeight:'600', fontSize:14 },

  // Footer Actions (Sticky Bottom via absolute)
  footerButtons: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: '#eee',
    padding: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  scanMoreButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#4A90E2", borderRadius: 12, marginBottom: 10,
  },
  scanMoreText: { color: "#4A90E2", fontSize: 16, fontWeight: "600", marginLeft: 8 },

  reloadButton: { padding: 14, backgroundColor: "#E9EDF5", borderRadius: 12, alignItems: "center", marginBottom: 10 },
  reloadText: { color: "#333", fontWeight: "600", fontSize:16 },

  checkoutButton: { backgroundColor: "#4A90E2", padding: 16, borderRadius: 12, alignItems: "center" },
  checkoutText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Modals
  modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitleOld: { fontSize: 20, fontWeight: "700", marginBottom: 15, textAlign:'center' },
  input: { borderWidth: 1, borderColor: "#DDD", padding: 12, borderRadius: 8, marginBottom: 12, fontSize:16, backgroundColor:'#FAFAFA' },
  
  saveButton: { backgroundColor: "#10B981", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 5 },
  saveText: { color: "#fff", fontWeight: "700", fontSize:16 },
  cancelButton: { backgroundColor: "#94A3B8", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 10 },
  cancelText: { color: "#fff", fontWeight: "700", fontSize:16 },
  confirmMessage: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },

  // Large Modal (Historique)
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainerLarge: { backgroundColor: "#F7F9FC", borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "80%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#1E293B" },
  modalSubtitle: { fontSize: 14, color: "#64748B", marginBottom: 15 },
  closeIconButton: { padding: 5, backgroundColor: "#E2E8F0", borderRadius: 20 },
  
  orderCard: { backgroundColor: "#fff", borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: "#eee" },
  orderCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  orderNumberContainer: { backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  orderNumberText: { color: "#4A90E2", fontWeight: "700" },
  orderDateText: { color: "#94A3B8", fontSize: 12 },
  orderCardBody: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  orderInfoText: { fontSize: 14, color: "#333" },
});