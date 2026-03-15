// Za emulator Android koristi 10.0.2.2:4000 umjesto localhost
const API_BASE = "http://localhost:4000/api";

function getToken(): string | null {
  return null; // React Native: koristit AsyncStorage u AuthContext
}

export async function api<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  let url = `${API_BASE}${path}`;
  if (params) {
    const search = new URLSearchParams(params).toString();
    url += (path.includes("?") ? "&" : "?") + search;
  }
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { ...fetchOptions, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { greska?: string }).greska || res.statusText);
  return data as T;
}

export type Korisnik = {
  id: string;
  email: string;
  ime: string;
  prezime: string;
  role: "ADMIN" | "VLASNIK" | "GOST";
};

export type AuthResponse = { token: string; korisnik: Korisnik };

export const auth = {
  login: (email: string, lozinka: string) =>
    api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, lozinka }) }),
  register: (email: string, lozinka: string, ime: string, prezime: string, uloga?: "VLASNIK" | "GOST") =>
    api<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, lozinka, ime, prezime, uloga: uloga || "GOST" }),
    }),
  me: (token: string) =>
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
      if (!r.ok) throw new Error("Niste prijavljeni");
      return r.json() as Promise<Korisnik>;
    }),
};

export type Restaurant = {
  id: string;
  naziv: string;
  opis: string | null;
  grad: string | null;
  adresa: string | null;
  radnoVrijeme: string | null;
  telefon: string | null;
  floorPlans?: { id: string; naziv: string; tables: { id: string; naziv: string; kapacitet: number }[] }[];
};

export type Reservation = {
  id: string;
  restaurantId: string;
  brojOsoba: number;
  datumVrijemeOd: string;
  datumVrijemeDo: string;
  status: string;
  restaurant?: { naziv: string; grad: string | null };
};

export const restaurants = {
  list: (grad?: string) =>
    fetch(`${API_BASE}/restaurants${grad ? `?grad=${encodeURIComponent(grad)}` : ""}`).then((r) => r.json() as Promise<Restaurant[]>),
  get: (id: string) => fetch(`${API_BASE}/restaurants/${id}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Restoran nije pronađen")))) as Promise<Restaurant>,
};

export const reservations = {
  my: (token: string) =>
    fetch(`${API_BASE}/reservations/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
      if (!r.ok) throw new Error("Greška");
      return r.json() as Promise<Reservation[]>;
    }),
  create: (restaurantId: string, body: { brojOsoba: number; datumVrijemeOd: string; datumVrijemeDo: string; napomena?: string }, token: string) =>
    api<Reservation>("/reservations/restaurant/" + restaurantId, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token}` } as HeadersInit,
    }),
};
