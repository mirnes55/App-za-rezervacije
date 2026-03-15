import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { reservations, type Reservation } from "../api";
import { useAuth } from "../context/AuthContext";

const statusTekst: Record<string, string> = {
  NA_CEKANJU: "Na čekanju",
  POTVRDJENA: "Potvrđena",
  OTAKZANA: "Otkazana",
};

export default function MojeRezervacije() {
  const { user } = useAuth();
  const location = useLocation();
  const [list, setList] = useState<Reservation[]>([]);
  const showSuccess = (location.state as { rezervacijaPoslata?: boolean })?.rezervacijaPoslata;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    reservations
      .my()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Greška"))
      .finally(() => setLoading(false));
  }, []);

  if (!user) {
    return (
      <div className="page">
        <p>Morate se prijaviti da biste vidjeli svoje rezervacije. <Link to="/prijava">Prijava</Link></p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Moje rezervacije</h1>
      {showSuccess && <p className="uspieh">Rezervacija je poslata! Restoran će vas obavijestiti o potvrdi.</p>}
      {error && <p className="greska">{error}</p>}
      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <ul className="rezervacije-list">
          {list.map((r) => (
            <li key={r.id}>
              <strong>{r.restaurant?.naziv ?? "Restoran"}</strong>
              {r.restaurant?.grad && <span> — {r.restaurant.grad}</span>}
              <p>
                {new Date(r.datumVrijemeOd).toLocaleString("bs-BA")} – {new Date(r.datumVrijemeDo).toLocaleString("bs-BA")}
              </p>
              <p>Broj osoba: {r.brojOsoba}. Status: {statusTekst[r.status] ?? r.status}</p>
            </li>
          ))}
        </ul>
      )}
      {!loading && list.length === 0 && <p>Nemate rezervacija.</p>}
    </div>
  );
}
