import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import supabase from "../lib/supabase";

type Article = {
  reference: string;  
  designation: string;
};

const QRCodesScreen = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchArticlesInDatabase(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchArticlesInDatabase = async (term: string) => {
    setLoading(true);
    
    // On limite à 50 résultats affichés d'un coup pour que la liste reste très flureferencee
    let query = supabase.from("articles").select("*").limit(50);

    const cleanTerm = term.trim();
    
    // Si la barre de recherche n'est pas vreferencee, on filtre dans Supabase
    if (cleanTerm !== "") {
      // ⚠️ IMPORTANT : Si ta colonne s'appelle "reference" dans Supabase, change "reference.ilike" en "reference.ilike"
      query = query.or(`designation.ilike.%${cleanTerm}%,reference.ilike.%${cleanTerm}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Erreur de recherche Supabase:", error);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  const printQRCode = async (article: Article) => {
    const qrString = `Référence: ${article.reference}\nDésignation: ${article.designation}`;
    
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrString)}`;
    
    const htmlContent = `
      <html>
        <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <h1 style="text-align: center; font-size: 20px;">${article.designation}</h1>
          <img src="${qrImageUrl}" alt="QR Code" style="wreferenceth: 100px; height: 100px; margin-top: 10px;" />
          <p style="margin-top: 10px; color: gray; font-size: 14px; text-align: center; white-space: pre-wrap; font-weight: bold;">
            ${qrString}
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Erreur lors de l'impression :", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des QR Codes</Text>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher réf ou désignation..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={"#757575"}
        />
      </View>

      {/* Liste des articles */}
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          // On utilise directement le tableau "articles" (la base de données l'a déjà filtré pour nous)
          data={articles} 
          keyExtractor={(item) => item.reference.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const qrString = `Référence: ${item.reference}\nDésignation: ${item.designation}`;

            return (
              <View style={styles.card}>
                <View style={styles.infoContainer}>
                  <Text style={styles.articleName}>{item.designation}</Text>
                  <Text style={styles.articleCode}>Réf: {item.reference}</Text>
                </View>
                
                <View style={styles.qrContainer}>
                  <QRCode value={qrString} size={60} />
                </View>

                <TouchableOpacity style={styles.printBtn} onPress={() => printQRCode(item)}>
                  <MaterialIcons name="print" size={24} color="white" />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun article trouvé pour cette recherche.</Text>}
        />
      )}
    </View>
  );
};

export default QRCodesScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F2F4F7", 
    padding: 20, 
    top: 60
},

  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 15, 
    color: "#1F2937" 
},

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16 
},

  card: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  infoContainer: { 
    flex: 1 
},

  articleName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#374151" 
},

  articleCode: { 
    fontSize: 12, 
    color: "#6B7280", 
    marginTop: 4 
},

  qrContainer: { 
    marginRight: 15, 
    padding: 5, 
    backgroundColor: "#fff" 
},

  printBtn: {
    backgroundColor: "#3B82F6",
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { 
    textAlign: "center", 
    marginTop: 20, 
    color: "#6B7280", 
    fontSize: 16 
},
});