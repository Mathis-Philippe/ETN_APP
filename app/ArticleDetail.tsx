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
  KeyboardAvoidingView, 
  Platform,
  Dimensions
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; 
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
  const [length, setLength] = useState<string>(""); 
  const [isTuyau, setIsTuyau] = useState(false); 

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      setArticle(null);
      setIsTuyau(false);
      setLength("");

      try {
        if (!qrData) {
          setError("QR code vide ❌");
          return;
        }

        const { reference } = parseQrData(qrData);

        if (!reference) {
          setError("Référence introuvable");
          return;
        }

        let { data, error } = await supabase
          .from("articles")
          .select("id, reference, designation, categorie")
          .eq("reference", reference)
          .maybeSingle();

        if (!data) {
             const res2 = await supabase.from("articles").select("*").ilike("reference", reference).maybeSingle();
             data = res2.data;
        }

        if (!data) {
          setError("Aucun article trouvé");
          return;
        }

        setArticle(data);

        if (data.categorie && data.categorie.toLowerCase().includes("tuyau")) {
          setIsTuyau(true);
        }

      } catch (e) {
        console.error(e);
        setError("Erreur de chargement");
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

  const increase = () => setQuantity(String(qtyNumber() + 1));
  const decrease = () => {
    const current = qtyNumber();
    if (current > 1) setQuantity(String(current - 1));
  };

  const handleAddToCart = () => {
    if (!article) return;
    const q = qtyNumber();

    if (q <= 0) {
      Alert.alert("Oups", "La quantité doit être supérieure à 0");
      return;
    }

    let finalDesignation = article.designation;
    let lengthValue: number | undefined = undefined;

    if (isTuyau) {
        const cleanLength = length.replace(',', '.');
        lengthValue = parseFloat(cleanLength);

        if (isNaN(lengthValue) || lengthValue <= 0) {
            Alert.alert("Attention", "Veuillez entrer une longueur valide (ex: 2.5).");
            return;
        }
        finalDesignation = `${article.designation} (${lengthValue}m)`;
    }

    addToCart({
      id: article.id || article.reference,
      code: article.reference,
      designation: finalDesignation,
      quantite: q,
      longueur: lengthValue,
    });

    Alert.alert("Succès", "Article ajouté au panier !");
    router.replace("/(tabs)/panier" as const);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={styles.loadingText}>Recherche de l'article...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
          <Text style={styles.btnSecondaryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!article) return null;

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          

          <View style={styles.header}>
            <View style={styles.iconBadge}>
               <Ionicons name={isTuyau ? "git-commit-outline" : "cube-outline"} size={32} color="#1e90ff" />
            </View>
            <Text style={styles.title}>{article.designation}</Text>
            <Text style={styles.ref}>{article.reference}</Text>
            
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{article.categorie || "Article Standard"}</Text>
            </View>
          </View>


          <View style={styles.card}>
            

            {isTuyau && (
              <View style={styles.section}>
                <Text style={styles.label}>
                   <Ionicons name="resize-outline" size={16} color="#555" /> Longueur de coupe
                </Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.inputLength}
                        placeholder="0.00"
                        placeholderTextColor="#ccc"
                        keyboardType="decimal-pad"
                        value={length}
                        onChangeText={setLength}
                        autoFocus={true}
                    />
                    <Text style={styles.unitText}>mètres</Text>
                </View>
              </View>
            )}

            {isTuyau && <View style={styles.divider} />}


            <View style={styles.section}>
               <Text style={styles.label}>
                   <Ionicons name="apps-outline" size={16} color="#555" /> Quantité
               </Text>
               
               <View style={styles.qtyContainer}>
                  <TouchableOpacity onPress={decrease} style={styles.qtyBtn} activeOpacity={0.7}>
                    <Ionicons name="remove" size={24} color="#333" />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                  
                  <TouchableOpacity onPress={increase} style={styles.qtyBtn} activeOpacity={0.7}>
                    <Ionicons name="add" size={24} color="#333" />
                  </TouchableOpacity>
               </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>


      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} activeOpacity={0.8}>
           <Ionicons name="cart" size={20} color="white" style={{marginRight: 8}} />
           <Text style={styles.addTxt}>Ajouter au panier</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelTxt}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA", 
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 140, 
    maxWidth: 600,
    width: "100%",
    alignSelf: "center", 
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  
  header: {
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E0F2FE", 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#1F2937",
    marginBottom: 4,
  },
  ref: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    letterSpacing: 0.5,
  },
  tagContainer: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    color: "#1E40AF",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },

  card: {
    alignSelf: "stretch", 
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  section: {
    width: "100%",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 20,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    height: 56,
  },
  inputLength: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
  },
  unitText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  qtyInput: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    color: "#1F2937",
    padding: 0,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, 
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    zIndex: 10,
  },
  addBtn: {
    backgroundColor: "#1e90ff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#1e90ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  addTxt: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelTxt: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },
  
  errorText: {
    color: "#374151",
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 16,
    textAlign: "center",
  },
  btnSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  btnSecondaryText: {
    color: "#374151",
    fontWeight: "600",
  },
});