import { useState, useEffect } from "react";
import { restaurants, reservations, type Restaurant, type Reservation } from "../api";
import { useAuth } from "../context/AuthContext";

const statusTekst: Record<string, string> = {
  NA_CEKANJU: "Na čekanju",
  POTVRDJENA: "Potvrđena",
  OTAKZANA: "Otkazana",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [restorani, setRestorani] = useState<Restaurant[]>([]);
  const [izabraniRestoran, setIzabraniRestoran] = useState<string | null>(null);
  const [rezervacije, setRezervacije] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noviNaziv, setNoviNaziv] = useState("");
  const [noviOpis, setNoviOpis] = useState("");
  const [noviGrad, setNoviGrad] = useState("");
  const [noviAdresa, setNoviAdresa] = useState("");
  const [noviTelefon, setNoviTelefon] = useState("");
  const [noviRadnoVrijeme, setNoviRadnoVrijeme] = useState("");
  const [dodavanjeRestorana, setDodavanjeRestorana] = useState(false);
  const [nazivRasporeda, setNazivRasporeda] = useState("");
  const [dodavanjeRasporeda, setDodavanjeRasporeda] = useState(false);
  const [nazivStola, setNazivStola] = useState("");
  const [kapacitetStola, setKapacitetStola] = useState(2);
  const [rasporedZaSto, setRasporedZaSto] = useState<string | null>(null);

  useEffect(() => {
    restaurants
      .list()
      .then(setRestorani)
      .catch((e) => setError(e instanceof Error ? e.message : "Greška"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!izabraniRestoran) {
      setRezervacije([]);
      return;
    }
    reservations.byRestaurant(izabraniRestoran).then(setRezervacije).catch(() => setRezervacije([]));
  }, [izabraniRestoran]);

  async function promijeniStatus(id: string, status: "POTVRDJENA" | "OTAKZANA") {
    try {
      await reservations.updateStatus(id, status);
      if (izabraniRestoran) {
        const list = await reservations.byRestaurant(izabraniRestoran);
        setRezervacije(list);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function dodajRestoran(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await restaurants.create({ naziv: noviNaziv.trim(), opis: noviOpis.trim() || undefined, grad: noviGrad.trim() || undefined, adresa: noviAdresa.trim() || undefined, telefon: noviTelefon.trim() || undefined, radnoVrijeme: noviRadnoVrijeme.trim() || undefined });
      setNoviNaziv(""); setNoviOpis(""); setNoviGrad(""); setNoviAdresa(""); setNoviTelefon(""); setNoviRadnoVrijeme("");
      setDodavanjeRestorana(false);
      const list = await restaurants.list();
      setRestorani(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Greška");
    }
  }

  async function dodajRaspored(e: React.FormEvent) {
    e.preventDefault();
    if (!izabraniRestoran) return;
    setError("");
    try {
      await restaurants.createFloorPlan(izabraniRestoran, { naziv: nazivRasporeda.trim() });
      setNazivRasporeda("");
      setDodavanjeRasporeda(false);
      const list = await restaurants.list();
      setRestorani(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Greška");
    }
  }

  async function dodajSto(e: React.FormEvent) {
    e.preventDefault();
    if (!rasporedZaSto || !nazivStola.trim()) return;
    setError("");
    try {
      await restaurants.createTable(rasporedZaSto, { naziv: nazivStola.trim(), kapacitet: kapacitetStola });
      setNazivStola(""); setKapacitetStola(2); setRasporedZaSto(null);
      const list = await restaurants.list();
      setRestorani(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Greška");
    }
  }

  if (!user || user.role !== "VLASNIK") {
    return (
      <div className="page">
        <p>Samo vlasnici restorana imaju pristup dashboardu.</p>
      </div>
    );
  }

  const mojiRestorani = restorani.filter((r) => r.ownerId === user.id);
  const izabraniRestoranObj = mojiRestorani.find((r) => r.id === izabraniRestoran);

  return (
    <div className="page">
      <h1>Dashboard vlasnika</h1>
      {error && <p className="greska">{error}</p>}
      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <>
          <section>
            <h2>Moji restorani</h2>
            {!dodavanjeRestorana ? (
              <button type="button" onClick={() => setDodavanjeRestorana(true)}>Dodaj novi restoran</button>
            ) : (
              <form onSubmit={dodajRestoran}>
                <label>Naziv <input value={noviNaziv} onChange={(e) => setNoviNaziv(e.target.value)} required /></label>
                <label>Opis <input value={noviOpis} onChange={(e) => setNoviOpis(e.target.value)} /></label>
                <label>Grad <input value={noviGrad} onChange={(e) => setNoviGrad(e.target.value)} /></label>
                <label>Adresa <input value={noviAdresa} onChange={(e) => setNoviAdresa(e.target.value)} /></label>
                <label>Telefon <input value={noviTelefon} onChange={(e) => setNoviTelefon(e.target.value)} /></label>
                <label>Radno vrijeme <input value={noviRadnoVrijeme} onChange={(e) => setNoviRadnoVrijeme(e.target.value)} placeholder="npr. 09–23" /></label>
                <button type="submit">Spremi</button>
                <button type="button" onClick={() => setDodavanjeRestorana(false)}>Odustani</button>
              </form>
            )}
            <label>
              Izaberi restoran za pregled rezervacija i rasporede
              <select value={izabraniRestoran ?? ""} onChange={(e) => setIzabraniRestoran(e.target.value || null)}>
                <option value="">-- Izaberi --</option>
                {mojiRestorani.map((r) => (
                  <option key={r.id} value={r.id}>{r.naziv}</option>
                ))}
              </select>
            </label>
          </section>
          {izabraniRestoran && izabraniRestoranObj && (
            <section>
              <h2>Rasporedi i stolovi</h2>
              {!dodavanjeRasporeda ? (
                <button type="button" onClick={() => setDodavanjeRasporeda(true)}>Dodaj raspored</button>
              ) : (
                <form onSubmit={dodajRaspored}>
                  <label>Naziv rasporeda (npr. Prizemlje, Terasa) <input value={nazivRasporeda} onChange={(e) => setNazivRasporeda(e.target.value)} required /></label>
                  <button type="submit">Dodaj</button>
                  <button type="button" onClick={() => setDodavanjeRasporeda(false)}>Odustani</button>
                </form>
              )}
              {izabraniRestoranObj.floorPlans && izabraniRestoranObj.floorPlans.length > 0 && (
                <>
                  <h3>Dodaj sto</h3>
                  <form onSubmit={dodajSto}>
                    <label>Raspored <select value={rasporedZaSto ?? ""} onChange={(e) => setRasporedZaSto(e.target.value || null)} required>
                      <option value="">-- Izaberi --</option>
                      {izabraniRestoranObj.floorPlans.map((fp) => (
                        <option key={fp.id} value={fp.id}>{fp.naziv}</option>
                      ))}
                    </select></label>
                    <label>Naziv stola <input value={nazivStola} onChange={(e) => setNazivStola(e.target.value)} placeholder="Sto 1" required /></label>
                    <label>Kapacitet <input type="number" min={1} value={kapacitetStola} onChange={(e) => setKapacitetStola(Number(e.target.value))} /></label>
                    <button type="submit">Dodaj sto</button>
                  </form>
                  <ul>
                    {izabraniRestoranObj.floorPlans.map((fp) => (
                      <li key={fp.id}><strong>{fp.naziv}</strong>
                        <ul>{fp.tables.map((t) => <li key={t.id}>{t.naziv} (kapacitet: {t.kapacitet})</li>)}</ul>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
          {izabraniRestoran && (
            <section>
              <h2>Rezervacije</h2>
              <ul className="rezervacije-list">
                {rezervacije.map((r) => (
                  <li key={r.id}>
                    <p>{new Date(r.datumVrijemeOd).toLocaleString("bs-BA")} – {r.brojOsoba} osoba</p>
                    <p>Status: {statusTekst[r.status] ?? r.status}</p>
                    {r.status === "NA_CEKANJU" && (
                      <>
                        <button type="button" onClick={() => promijeniStatus(r.id, "POTVRDJENA")}>Potvrdi</button>
                        <button type="button" onClick={() => promijeniStatus(r.id, "OTAKZANA")}>Otkaži</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {rezervacije.length === 0 && <p>Nema rezervacija za ovaj restoran.</p>}
            </section>
          )}
        </>
      )}
    </div>
  );
}
