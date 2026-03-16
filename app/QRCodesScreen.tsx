import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import supabase from "../lib/supabase";

type Article = {
  reference: string;  
  designation: string;
  categorie?: string; 
  isCustom?: boolean; // Permet de savoir si c'est un article créé manuellement
};

const QRCodesScreen = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchArticlesInDatabase(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchArticlesInDatabase = async (term: string) => {
    setLoading(true);
    const cleanTerm = term.trim();
    
    // 1. Préparer la requête pour les articles standards
    let queryStandard = supabase
      .from("articles")
      .select("reference, designation, categorie")
      .limit(5000); 

    if (cleanTerm !== "") {
      queryStandard = queryStandard.or(`designation.ilike.%${cleanTerm}%,reference.ilike.%${cleanTerm}%`);
    }

    // 2. Préparer la requête pour les articles créés manuellement
    let queryCustom = supabase
      .from("app_created_references")
      .select("code, designation, category")
      .limit(5000);

    if (cleanTerm !== "") {
      queryCustom = queryCustom.or(`designation.ilike.%${cleanTerm}%,code.ilike.%${cleanTerm}%`);
    }

    // 3. Exécuter les deux requêtes en parallèle pour gagner du temps
    const [resStandard, resCustom] = await Promise.all([queryStandard, queryCustom]);

    if (resStandard.error) console.error("Erreur de recherche articles:", resStandard.error);
    if (resCustom.error) console.error("Erreur de recherche custom:", resCustom.error);

    // 4. Formater et fusionner les résultats
    const standardData: Article[] = resStandard.data || [];
    
    const customData: Article[] = (resCustom.data || []).map(item => ({
      reference: item.code,
      designation: item.designation,
      categorie: item.category, // On map 'category' vers 'categorie'
      isCustom: true
    }));

    // On combine les deux tableaux
    const combinedArticles = [...standardData, ...customData];
    
    setArticles(combinedArticles);
    setLoading(false);
  };

  const groupedArticles = useMemo(() => {
    const groups = articles.reduce((acc, article) => {
      const cat = article.categorie || "Autres";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    }, {} as Record<string, Article[]>);

    return Object.keys(groups).sort().map((key) => {
      const isExpanded = expandedCategories.includes(key);
      return {
        title: key,
        data: isExpanded ? groups[key] : [], 
        totalCount: groups[key].length, 
      };
    });
  }, [articles, expandedCategories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => 
      prev.includes(category) 
        ? prev.filter((c) => c !== category)
        : [...prev, category] 
    );
  };

const printQRCode = async (article: Article) => {
    // Si vous utilisez la syntaxe "ref:123" pour votre scanner, vous pouvez adapter qrString ici
    const qrString = `Référence: ${article.reference}\nDésignation: ${article.designation}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrString)}`;
    
    const getHtmlContent = (isWeb: boolean) => `
      <html>
        <head>
          <style>
            @page { margin: 0; }
            body {
              margin: 0;
              padding-top: 50px;
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              font-family: sans-serif;
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; font-size: 14px; margin-bottom: 20px;">${article.reference}</h1>
          <img
            src="${qrImageUrl}"
            alt="QR Code"
            style="width: 100px; height: 100px;" 
            ${isWeb ? 'onload="window.print();"' : ''} 
          />
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(getHtmlContent(true));
          doc.close();
        }

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 5000);

      } else {
        await Print.printAsync({ html: getHtmlContent(false) });
      }
    } catch (error) {
      console.error("Erreur lors de l'impression :", error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des QR Codes</Text>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher réf ou désignation..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={"#727272"}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
      ) : (
        <SectionList
          sections={groupedArticles}
          keyExtractor={(item, index) => `${item.reference}-${index}`} // Ajout de l'index au cas où il y ait des doublons temporaires
          contentContainerStyle={{ paddingBottom: 20 }}
          stickySectionHeadersEnabled={false}
          
          renderSectionHeader={({ section }) => {
            const isExpanded = expandedCategories.includes(section.title);
            return (
              <TouchableOpacity 
                style={styles.categoryHeader} 
                onPress={() => toggleCategory(section.title)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryTitle}>
                  {section.title} ({section.totalCount})
                </Text>
                <MaterialIcons 
                  name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color="#4B5563" 
                />
              </TouchableOpacity>
            );
          }}

          renderItem={({ item }) => {
            const qrString = `Référence: ${item.reference}\nDésignation: ${item.designation}`;
            return (
              <View style={styles.card}>
                <View style={styles.infoContainer}>
                  <Text style={styles.articleName}>
                    {item.designation}
                  </Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                    <Text style={styles.articleCode}>Réf: {item.reference}</Text>
                    {item.isCustom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>Nouveau</Text>
                      </View>
                    )}
                  </View>
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
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun article trouvé.</Text>}
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
  
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "uppercase",
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
  },

  customBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  customBadgeText: {
    color: "#059669",
    fontSize: 10,
    fontWeight: "bold",
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