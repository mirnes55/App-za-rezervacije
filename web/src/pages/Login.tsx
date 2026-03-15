import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [greska, setGreska] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGreska("");
    setLoading(true);
    try {
      await login(email, lozinka);
      navigate("/", { replace: true });
    } catch (err) {
      setGreska(err instanceof Error ? err.message : "Greška pri prijavi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page auth-page">
      <h1>Prijava</h1>
      <form onSubmit={handleSubmit}>
        {greska && <p className="greska">{greska}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Lozinka
          <input type="password" value={lozinka} onChange={(e) => setLozinka(e.target.value)} required autoComplete="current-password" />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Prijava..." : "Prijavi se"}
        </button>
      </form>
      <p>
        Nemate račun? <Link to="/registracija">Registrujte se</Link>
      </p>
    </div>
  );
}
