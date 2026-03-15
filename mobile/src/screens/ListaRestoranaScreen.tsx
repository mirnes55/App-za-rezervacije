import { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { restaurants, type Restaurant } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ListaRestoranaScreen() {
  const [list, setList] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 8, marginRight: 8 }}>
          {user ? (
            <TouchableOpacity onPress={() => navigation.navigate("MojeRezervacije")}>
              <Text style={{ color: "#fff" }}>Moje rezervacije</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={{ color: "#fff" }}>Prijava</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Registracija")}>
                <Text style={{ color: "#fff" }}>Registracija</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [navigation, user]);

  useEffect(() => {
    restaurants
      .list()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Greška"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  if (error) return <View style={styles.centered}><Text style={styles.greska}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restorani</Text>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("DetaljiRestorana", { id: item.id })}>
            <Text style={styles.naziv}>{item.naziv}</Text>
            {item.grad ? <Text style={styles.grad}>{item.grad}</Text> : null}
            {item.opis ? <Text style={styles.opis} numberOfLines={2}>{item.opis}</Text> : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 16 },
  greska: { color: "#c0392b" },
  card: { padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8, marginBottom: 12 },
  naziv: { fontSize: 18, fontWeight: "bold" },
  grad: { color: "#555", marginTop: 4 },
  opis: { color: "#666", marginTop: 4 },
});
