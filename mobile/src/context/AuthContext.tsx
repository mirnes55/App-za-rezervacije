import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, type Korisnik } from "../api";

const TOKEN_KEY = "token";

type AuthContextType = {
  user: Korisnik | null;
  token: string | null;
  login: (email: string, lozinka: string) => Promise<void>;
  register: (email: string, lozinka: string, ime: string, prezime: string, uloga?: "VLASNIK" | "GOST") => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Korisnik | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const t = await AsyncStorage.getItem(TOKEN_KEY);
    if (!t) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const me = await auth.me(t);
      setUser(me);
      setToken(t);
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
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
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.korisnik);
  }, []);

  const register = useCallback(
    async (email: string, lozinka: string, ime: string, prezime: string, uloga?: "VLASNIK" | "GOST") => {
      const res = await auth.register(email, lozinka, ime, prezime, uloga);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.korisnik);
    },
    []
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
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
