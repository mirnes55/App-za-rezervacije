import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { restaurants, reservations, type Restaurant } from "../api";
import { useAuth } from "../context/AuthContext";

export default function DetaljiRestorana() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  async function handleRezervacija(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !user) {
      setRezGreska("Morate biti prijavljeni da biste rezervisali.");
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
      });
      navigate("/moje-rezervacije", { state: { rezervacijaPoslata: true } });
    } catch (err) {
      setRezGreska(err instanceof Error ? err.message : "Greška pri rezervaciji.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!id) return null;
  if (loading) return <div className="page">Učitavanje...</div>;
  if (error || !restaurant) return <div className="page"><p className="greska">{error || "Restoran nije pronađen."}</p></div>;

  return (
    <div className="page">
      <h1>{restaurant.naziv}</h1>
      {restaurant.grad && <p>Grad: {restaurant.grad}</p>}
      {restaurant.adresa && <p>Adresa: {restaurant.adresa}</p>}
      {restaurant.radnoVrijeme && <p>Radno vrijeme: {restaurant.radnoVrijeme}</p>}
      {restaurant.telefon && <p>Telefon: {restaurant.telefon}</p>}
      {restaurant.opis && <p>{restaurant.opis}</p>}

      {restaurant.floorPlans && restaurant.floorPlans.length > 0 && (
        <section>
          <h2>Raspored stolova</h2>
          {restaurant.floorPlans.map((fp) => (
            <div key={fp.id}>
              <h3>{fp.naziv}</h3>
              <ul>
                {fp.tables.map((t) => (
                  <li key={t.id}>Sto: {t.naziv}, kapacitet: {t.kapacitet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="rezervacija-form">
        <h2>Rezerviši sto</h2>
        {!user ? (
          <p>Morate se <Link to="/prijava">prijaviti</Link> da biste napravili rezervaciju.</p>
        ) : (
          <form onSubmit={handleRezervacija}>
            {rezGreska && <p className="greska">{rezGreska}</p>}
            <label>
              Broj osoba
              <input type="number" min={1} value={brojOsoba} onChange={(e) => setBrojOsoba(Number(e.target.value))} />
            </label>
            <label>
              Datum
              <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required />
            </label>
            <label>
              Vrijeme od
              <input type="time" value={vrijemeOd} onChange={(e) => setVrijemeOd(e.target.value)} />
            </label>
            <label>
              Vrijeme do
              <input type="time" value={vrijemeDo} onChange={(e) => setVrijemeDo(e.target.value)} />
            </label>
            <label>
              Napomena
              <textarea value={napomena} onChange={(e) => setNapomena(e.target.value)} />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? "Slanje..." : "Pošalji rezervaciju"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
