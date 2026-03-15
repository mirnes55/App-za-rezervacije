import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { restaurants, reservations, type Restaurant } from "../api";
import { useAuth } from "../context/AuthContext";

export default function DetaljiRestoranaScreen() {
  const { params } = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const id = params?.id;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brojOsoba, setBrojOsoba] = useState(2);
  const [datum, setDatum] = useState("");
  const [vrijemeOd, setVrijemeOd] = useState("18:00");
  const [vrijemeDo, setVrijemeDo] = useState("20:00");
  const [napomena, setNapomena] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rezGreska, setRezGreska] = useState("");

  useEffect(() => {
    if (!id) return;
    restaurants
      .get(id)
      .then(setRestaurant)
      .catch((e) => setError(e instanceof Error ? e.message : "Greška"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRezervacija() {
    if (!id || !user || !token) {
      setRezGreska("Morate biti prijavljeni.");
      return;
    }
    const od = new Date(datum + "T" + vrijemeOd);
    const do_ = new Date(datum + "T" + vrijemeDo);
    setRezGreska("");
    setSubmitting(true);
    try {
      await reservations.create(id, {
        brojOsoba,
        datumVrijemeOd: od.toISOString(),
        datumVrijemeDo: do_.toISOString(),
        napomena: napomena || undefined,
      }, token);
      navigation.navigate("MojeRezervacije");
    } catch (err) {
      setRezGreska(err instanceof Error ? err.message : "Greška pri rezervaciji.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!id) return null;
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  if (error || !restaurant) return <View style={styles.centered}><Text style={styles.greska}>{error || "Restoran nije pronađen."}</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{restaurant.naziv}</Text>
      {restaurant.grad ? <Text>Grad: {restaurant.grad}</Text> : null}
      {restaurant.adresa ? <Text>Adresa: {restaurant.adresa}</Text> : null}
      {restaurant.opis ? <Text style={styles.opis}>{restaurant.opis}</Text> : null}

      <Text style={styles.sectionTitle}>Rezerviši sto</Text>
      {!user ? (
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Prijavite se da biste rezervisali.</Text>
        </TouchableOpacity>
      ) : (
        <View>
          {rezGreska ? <Text style={styles.greska}>{rezGreska}</Text> : null}
          <TextInput style={styles.input} placeholder="Datum (YYYY-MM-DD)" value={datum} onChangeText={setDatum} />
          <TextInput style={styles.input} placeholder="Vrijeme od" value={vrijemeOd} onChangeText={setVrijemeOd} />
          <TextInput style={styles.input} placeholder="Vrijeme do" value={vrijemeDo} onChangeText={setVrijemeDo} />
          <TextInput style={styles.input} placeholder="Broj osoba" value={String(brojOsoba)} onChangeText={(t) => setBrojOsoba(Number(t) || 2)} keyboardType="number-pad" />
          <TextInput style={styles.input} placeholder="Napomena" value={napomena} onChangeText={setNapomena} />
          <TouchableOpacity style={styles.button} onPress={handleRezervacija} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? "Slanje..." : "Pošalji rezervaciju"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 12 },
  opis: { marginBottom: 16 },
  greska: { color: "#c0392b", marginBottom: 8 },
  sectionTitle: { fontSize: 18, marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, marginBottom: 12, borderRadius: 8 },
  button: { backgroundColor: "#2c3e50", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff" },
  link: { color: "#2980b9", marginBottom: 12 },
});
