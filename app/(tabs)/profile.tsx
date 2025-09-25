import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import  supabase  from "../../lib/supabase"; 

export default function ProfileScreen() {
  const { client, logout, setClient } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const [nom, setNom] = useState(client?.nom || "");
  const [adresse, setAdresse] = useState(client?.adresse || "");
  const [codePostal, setCodePostal] = useState(client?.code_postal || "");
  const [ville, setVille] = useState(client?.ville || "");
  const [commercial, setCommercial] = useState(client?.commercial || "");

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Aucun profil trouvé</Text>
      </View>
    );
  }

  // Fonction de sauvegarde dans Supabase
  const handleSave = async () => {
    const { error } = await supabase
      .from("clients")
      .update({
        nom,
        adresse,
        code_postal: codePostal,
        ville,
        commercial,
      })
      .eq("code_client", client.codeClient);

    if (error) {
      console.error("Erreur maj supabase :", error);
    } else {
      setClient({
        ...client,
        nom,
        adresse,
        code_postal: codePostal,
        ville,
        commercial,
      });
      setModalVisible(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Header Profil */}
        <View style={styles.header}>
          <MaterialIcons name="business" size={64} color="#4A90E2" />
          <Text style={styles.title}>Profil Société</Text>
        </View>

        {/* Carte d’informations */}
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialIcons name="badge" size={22} color="#4A90E2" />
            <Text style={styles.label}>Nom :</Text>
            <Text style={styles.value}>{client.nom}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <MaterialIcons name="location-on" size={22} color="#4A90E2" />
            <Text style={styles.label}>Adresse :</Text>
            <Text style={styles.value}>
              {client.adresse}, {client.code_postal} {client.ville}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <MaterialIcons name="person-outline" size={22} color="#4A90E2" />
            <Text style={styles.label}>Commercial :</Text>
            <Text style={styles.value}>{client.commercial}</Text>
          </View>
        </View>

        {/* Bouton Modifier */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="edit" size={20} color="#fff" />
          <Text style={styles.logoutText}>Modifier</Text>
        </TouchableOpacity>

        {/* Bouton Déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"} // 
              >
          
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Modifier le Profil</Text>
              <Text style={styles.modalSubtitle}>
                Mets à jour les informations de ton entreprise.
              </Text>

              {/* Champ Nom */}
              <View style={styles.inputGroup}>
                <MaterialIcons name="badge" size={20} color="#4A90E2" />
                <TextInput
                  style={styles.input}
                  placeholder="Nom de la société"
                  value={nom}
                  onChangeText={setNom}
                />
              </View>

              {/* Champ Adresse */}
              <View style={styles.inputGroup}>
                <MaterialIcons name="location-on" size={20} color="#4A90E2" />
                <TextInput
                  style={styles.input}
                  placeholder="Adresse"
                  value={adresse}
                  onChangeText={setAdresse}
                />
              </View>

              {/* Champ Code postal */}
              <View style={styles.inputGroup}>
                <MaterialIcons name="markunread-mailbox" size={20} color="#4A90E2" />
                <TextInput
                  style={styles.input}
                  placeholder="Code postal"
                  value={codePostal}
                  onChangeText={setCodePostal}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  submitBehavior="blurAndSubmit"
                />
              </View>

              {/* Champ Ville */}
              <View style={styles.inputGroup}>
                <MaterialIcons name="apartment" size={20} color="#4A90E2" />
                <TextInput
                  style={styles.input}
                  placeholder="Ville"
                  value={ville}
                  onChangeText={setVille}
                />
              </View>

              {/* Champ Commercial */}
              <View style={styles.inputGroup}>
                <MaterialIcons name="person-outline" size={20} color="#4A90E2" />
                <TextInput
                  style={styles.input}
                  placeholder="Commercial"
                  value={commercial}
                  onChangeText={setCommercial}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  submitBehavior="blurAndSubmit"
                />
              </View>

              {/* Boutons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <MaterialIcons name="check-circle" size={20} color="#fff" />
                  <Text style={styles.saveText}>Enregistrer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialIcons name="cancel" size={20} color="#374151" />
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F7",
    padding: 20,
    marginTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 12,
    color: "#1F2937",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
    color: "#374151",
    width: 120,
  },
  value: {
    fontSize: 16,
    color: "#6B7280",
    flex: 1,
    flexWrap: "wrap",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 10,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    fontSize: 18,
    color: "#DC2626",
    fontWeight: "600",
  },
modalContainer: {
  flex: 1,
  justifyContent: "center",
  backgroundColor: "rgba(0,0,0,0.5)",
  padding: 20,
},
modalContent: {
  backgroundColor: "#fff",
  borderRadius: 20,
  padding: 24,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 6,
},
modalTitle: {
  fontSize: 22,
  fontWeight: "700",
  color: "#1F2937",
  marginBottom: 4,
  textAlign: "center",
},
modalSubtitle: {
  fontSize: 14,
  color: "#6B7280",
  marginBottom: 20,
  textAlign: "center",
},
inputGroup: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 8,
  marginBottom: 14,
  backgroundColor: "#F9FAFB",
},
input: {
  flex: 1,
  marginLeft: 10,
  fontSize: 16,
  color: "#374151",
},
modalButtons: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 20,
},
saveButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#10B981",
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 10,
  flex: 1,
  justifyContent: "center",
  marginRight: 8,
},
saveText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
  marginLeft: 8,
},
cancelButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#E5E7EB",
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 10,
  flex: 1,
  justifyContent: "center",
  marginLeft: 8,
},
cancelText: {
  color: "#374151",
  fontSize: 16,
  fontWeight: "600",
  marginLeft: 8,
},

});
