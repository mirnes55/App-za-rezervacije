const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getToken(): string | null {
  return localStorage.getItem("token");
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
  me: () => api<Korisnik>("/auth/me"),
};

export type Restaurant = {
  id: string;
  ownerId?: string;
  naziv: string;
  opis: string | null;
  adresa: string | null;
  grad: string | null;
  radnoVrijeme: string | null;
  telefon: string | null;
  floorPlans?: { id: string; naziv: string; tables: { id: string; naziv: string; kapacitet: number }[] }[];
};

export type Reservation = {
  id: string;
  restaurantId: string;
  tableId: string | null;
  brojOsoba: number;
  datumVrijemeOd: string;
  datumVrijemeDo: string;
  status: "NA_CEKANJU" | "POTVRDJENA" | "OTAKZANA";
  napomena: string | null;
  restaurant?: { id: string; naziv: string; adresa: string | null; grad: string | null };
  table?: { id: string; naziv: string } | null;
};

export const restaurants = {
  list: (grad?: string) => api<Restaurant[]>("/restaurants", { params: grad ? { grad } : undefined }),
  get: (id: string) => api<Restaurant>("/restaurants/" + id),
  create: (body: { naziv: string; opis?: string; adresa?: string; grad?: string; radnoVrijeme?: string; telefon?: string }) =>
    api<Restaurant>("/restaurants", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ naziv: string; opis: string; adresa: string; grad: string; radnoVrijeme: string; telefon: string }>) =>
    api<Restaurant>("/restaurants/" + id, { method: "PUT", body: JSON.stringify(body) }),
  floorPlans: (restaurantId: string) => api<unknown[]>("/restaurants/" + restaurantId + "/floor-plans"),
  createFloorPlan: (restaurantId: string, body: { naziv: string; width?: number; height?: number }) =>
    api<unknown>("/restaurants/" + restaurantId + "/floor-plans", { method: "POST", body: JSON.stringify(body) }),
  createTable: (floorPlanId: string, body: { naziv: string; kapacitet?: number; positionX?: number; positionY?: number }) =>
    api<unknown>("/restaurants/floor-plans/" + floorPlanId + "/tables", { method: "POST", body: JSON.stringify(body) }),
};

export const reservations = {
  my: () => api<Reservation[]>("/reservations/me"),
  byRestaurant: (restaurantId: string, od?: string, do_?: string, status?: string) =>
    api<Reservation[]>("/reservations/restaurant/" + restaurantId, {
      params: { ...(od && { od }), ...(do_ && { do: do_ }), ...(status && { status }) },
    }),
  create: (restaurantId: string, body: { tableId?: string; brojOsoba: number; datumVrijemeOd: string; datumVrijemeDo: string; napomena?: string }) =>
    api<Reservation>("/reservations/restaurant/" + restaurantId, { method: "POST", body: JSON.stringify(body) }),
  updateStatus: (id: string, status: "NA_CEKANJU" | "POTVRDJENA" | "OTAKZANA") =>
    api<Reservation>("/reservations/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) }),
};
