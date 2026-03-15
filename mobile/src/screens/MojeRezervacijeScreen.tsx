import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { reservations, type Reservation } from "../api";
import { useAuth } from "../context/AuthContext";

const statusTekst: Record<string, string> = {
  NA_CEKANJU: "Na čekanju",
  POTVRDJENA: "Potvrđena",
  OTAKZANA: "Otkazana",
};

export default function MojeRezervacijeScreen() {
  const { user, token } = useAuth();
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!token) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    reservations
      .my(token)
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Greška"))
      .finally(() => setLoading(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [token])
  );

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>Morate se prijaviti da biste vidjeli rezervacije.</Text>
      </View>
    );
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moje rezervacije</Text>
      {error ? <Text style={styles.greska}>{error}</Text> : null}
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.naziv}>{item.restaurant?.naziv ?? "Restoran"}</Text>
            {item.restaurant?.grad ? <Text>{item.restaurant.grad}</Text> : null}
            <Text>{new Date(item.datumVrijemeOd).toLocaleString("bs-BA")} – {new Date(item.datumVrijemeDo).toLocaleString("bs-BA")}</Text>
            <Text>Broj osoba: {item.brojOsoba}. Status: {statusTekst[item.status] ?? item.status}</Text>
          </View>
        )}
      />
      {list.length === 0 && !error && <Text style={styles.empty}>Nemate rezervacija.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 16 },
  greska: { color: "#c0392b", marginBottom: 8 },
  card: { padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8, marginBottom: 12 },
  naziv: { fontSize: 18, fontWeight: "bold" },
  empty: { textAlign: "center", marginTop: 20 },
});
