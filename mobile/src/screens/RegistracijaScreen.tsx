import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function RegistracijaScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [greska, setGreska] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  async function handleSubmit() {
    setGreska("");
    setLoading(true);
    try {
      await register(email, lozinka, ime, prezime, "GOST");
      onSuccess();
    } catch (err) {
      setGreska(err instanceof Error ? err.message : "Greška pri registraciji.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registracija</Text>
      {greska ? <Text style={styles.greska}>{greska}</Text> : null}
      <TextInput style={styles.input} placeholder="Ime" value={ime} onChangeText={setIme} />
      <TextInput style={styles.input} placeholder="Prezime" value={prezime} onChangeText={setPrezime} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Lozinka" value={lozinka} onChangeText={setLozinka} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registruj se</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  greska: { color: "#c0392b", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, marginBottom: 12, borderRadius: 8 },
  button: { backgroundColor: "#2c3e50", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16 },
});
