import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { restaurants, type Restaurant } from "../api";

export default function ListaRestorana() {
  const [list, setList] = useState<Restaurant[]>([]);
  const [grad, setGrad] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    restaurants
      .list(grad || undefined)
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Greška"))
      .finally(() => setLoading(false));
  }, [grad]);

  return (
    <div className="page">
      <h1>Restorani</h1>
      <label className="filter">
        Filter po gradu
        <input type="text" value={grad} onChange={(e) => setGrad(e.target.value)} placeholder="Grad" />
      </label>
      {error && <p className="greska">{error}</p>}
      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <ul className="restaurant-list">
          {list.map((r) => (
            <li key={r.id}>
              <Link to={"/restoran/" + r.id}>
                <strong>{r.naziv}</strong>
                {r.grad && <span> — {r.grad}</span>}
                {r.opis && <p>{r.opis}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!loading && list.length === 0 && <p>Nema restorana.</p>}
    </div>
  );
}
