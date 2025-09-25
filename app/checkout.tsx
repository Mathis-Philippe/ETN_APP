// app/checkout.tsx
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useCart } from "../context/CartContext";
import { useRouter } from "expo-router";

export default function CheckoutScreen() {
  const { cart, clearCart } = useCart();
  const router = useRouter();

  const total = cart.reduce(
    (sum, item) => sum + item.quantite * item.prix,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Récapitulatif de la commande</Text>

      {/* Liste des articles */}
      <FlatList
        data={cart}
        keyExtractor={(item, index) => item.id ?? index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{item.designation}</Text>
              <Text style={styles.price}>
                {(item.prix * item.quantite).toFixed(2)} €
              </Text>
            </View>
            <Text style={styles.sub}>
              {item.quantite} × {item.prix.toFixed(2)} €
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Votre panier est vide 🛒</Text>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Bloc résumé total */}
      {cart.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Frais de livraison</Text>
            <Text style={styles.totalValue}>5.00 €</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalFinal}>Total à payer</Text>
            <Text style={styles.totalFinal}>
              {(total + 5).toFixed(2)} €
            </Text>
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={() => {
              clearCart();
              router.push("/success"); // écran de confirmation à créer
            }}
          >
            <Text style={styles.payText}>Procéder au paiement</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC", padding: 20 },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 50,
    marginTop: 50,
    textAlign: "center",
    color: "#2C3E50",
  },

  // Carte article
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { flex: 1 ,fontSize: 16, fontWeight: "600", color: "#34495E", marginRight: 10 },
  sub: { fontSize: 14, color: "#7F8C8D", marginTop: 4 },
  price: { fontSize: 16, fontWeight: "700", color: "#27AE60", flexShrink: 0 },

  // Résumé total
  summary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  totalLabel: { fontSize: 16, color: "#555" },
  totalValue: { fontSize: 16, fontWeight: "600" },
  totalRow: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#EEE", paddingTop: 10 },
  totalFinal: { fontSize: 18, fontWeight: "700", color: "#2C3E50" },

  payButton: {
    marginTop: 20,
    backgroundColor: "#3498DB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  payText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  empty: { textAlign: "center", fontSize: 16, color: "#999", marginTop: 50 },
});
