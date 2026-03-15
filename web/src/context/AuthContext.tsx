import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { auth, type Korisnik } from "../api";

type AuthContextType = {
  user: Korisnik | null;
  token: string | null;
  login: (email: string, lozinka: string) => Promise<void>;
  register: (email: string, lozinka: string, ime: string, prezime: string, uloga?: "VLASNIK" | "GOST") => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Korisnik | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await auth.me();
      setUser(me);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, lozinka: string) => {
    const res = await auth.login(email, lozinka);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.korisnik);
  }, []);

  const register = useCallback(
    async (email: string, lozinka: string, ime: string, prezime: string, uloga?: "VLASNIK" | "GOST") => {
      const res = await auth.register(email, lozinka, ime, prezime, uloga);
      localStorage.setItem("token", res.token);
      setToken(res.token);
      setUser(res.korisnik);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth mora biti unutar AuthProvider");
  return ctx;
}
