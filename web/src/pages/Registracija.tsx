import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Registracija() {
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [uloga, setUloga] = useState<"GOST" | "VLASNIK">("GOST");
  const [greska, setGreska] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGreska("");
    setLoading(true);
    try {
      await register(email, lozinka, ime, prezime, uloga);
      navigate("/", { replace: true });
    } catch (err) {
      setGreska(err instanceof Error ? err.message : "Greška pri registraciji.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page auth-page">
      <h1>Registracija</h1>
      <form onSubmit={handleSubmit}>
        {greska && <p className="greska">{greska}</p>}
        <label>
          Ime
          <input type="text" value={ime} onChange={(e) => setIme(e.target.value)} required />
        </label>
        <label>
          Prezime
          <input type="text" value={prezime} onChange={(e) => setPrezime(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Lozinka
          <input type="password" value={lozinka} onChange={(e) => setLozinka(e.target.value)} required autoComplete="new-password" minLength={6} />
        </label>
        <label>
          Registrujem se kao
          <select value={uloga} onChange={(e) => setUloga(e.target.value as "GOST" | "VLASNIK")}>
            <option value="GOST">Gost (rezervacije)</option>
            <option value="VLASNIK">Vlasnik restorana</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Registracija..." : "Registruj se"}
        </button>
      </form>
      <p>
        Već imate račun? <Link to="/prijava">Prijavite se</Link>
      </p>
    </div>
  );
}
