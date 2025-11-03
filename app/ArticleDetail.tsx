import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import supabase from "../lib/supabase"; 
import { useCart } from "../context/CartContext";
import { parseQrData } from "../lib/qrParser";

export default function ArticleDetail() {
  const { qrData } = useLocalSearchParams<{ qrData?: string }>();
  const router = useRouter();
  const { addToCart } = useCart();

  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<string>("1");

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      setArticle(null);

      try {
        if (!qrData) {
          setError("QR code vide ❌");
          return;
        }

        const { reference } = parseQrData(qrData);

        if (!reference) {
          setError("Référence introuvable dans le QR code");
          return;
        }

        let { data, error } = await supabase
          .from("articles")
          .select("reference, designation, categorie")
          .eq("reference", reference)
          .maybeSingle();

        if (error) console.log("⚠️ Erreur supabase eq:", error.message || error);

        if (!data) {
          const res2 = await supabase
            .from("articles")
            .select("reference, designation, categorie")
            .ilike("reference", reference)
            .maybeSingle();
          if (res2.error) console.log("⚠️ Erreur supabase ilike:", res2.error.message || res2.error);
          data = res2.data;
        }

        if (!data) {
          const res3 = await supabase
            .from("articles")
            .select("reference, designation, categorie")
            .ilike("reference", `%${reference}%`)
            .limit(1);
          if (res3.error) console.log("⚠️ Erreur supabase ilike %:", res3.error.message || res3.error);
          data = Array.isArray(res3.data) && res3.data.length > 0 ? res3.data[0] : null;
        }

        if (!data) {
          setError("Aucun article trouvé pour cette référence");
          return;
        }

        setArticle(data);
      } catch (e) {
        console.error("❌ Exception fetchArticle:", e);
        setError("Erreur lors de la récupération de l'article");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [qrData]);

  const qtyNumber = () => {
    const n = parseInt(quantity || "0", 10);
    return isNaN(n) ? 0 : n;
  };

  const increase = () => {
    const current = qtyNumber();
    setQuantity(String(current + 1));
  };

  const decrease = () => {
    const current = qtyNumber();
    if (current > 1) {
      setQuantity(String(current - 1));
    }
  };

  const handleAddToCart = () => {
    if (!article) return;
    const q = qtyNumber();

    if (q <= 0) {
      Alert.alert("Quantité invalide");
      return;
    }

    addToCart({
      id: article.reference,
      code: article.reference,
      designation: article.designation,
      quantite: q,
      prix: 0,
    });

    Alert.alert("Ajouté ✅", "Article ajouté au panier");
    router.push("/panier" as const);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Chargement de l&apos;article...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!article) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{article.designation}</Text>
      <Text style={styles.sub}>Référence : {article.reference}</Text>
      <Text style={styles.sub}>Quantité :</Text>

      <View style={styles.qtyRow}>
        <TouchableOpacity onPress={decrease} style={styles.qtyBtn}>
          <Text style={styles.qtySign}>-</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.qtyInput}
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />
        <TouchableOpacity onPress={increase} style={styles.qtyBtn}>
          <Text style={styles.qtySign}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
        <Text style={styles.addTxt}>Ajouter au panier</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: "#999" }]} onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.btnText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center", marginTop: 250 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  sub: { fontSize: 16, marginBottom: 6 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  qtyBtn: { backgroundColor: "#eee", padding: 10, borderRadius: 8, marginHorizontal: 8 },
  qtySign: { fontSize: 18, fontWeight: "700" },
  qtyInput: { width: 80, textAlign: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 8 },
  addBtn: { backgroundColor: "#1e90ff", padding: 14, borderRadius: 10, width: "80%", alignItems: "center", marginBottom: 10 },
  addTxt: { color: "#fff", fontWeight: "700" },
  btn: { padding: 12, borderRadius: 8, backgroundColor: "#ccc", width: "60%", alignItems: "center", marginTop: 8 },
  btnText: { color: "#000", fontWeight: "600" },
  error: { color: "red", fontSize: 16, marginBottom: 12 },
});
