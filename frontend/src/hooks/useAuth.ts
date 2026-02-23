"use client";

import * as React from "react";
import { apiGet, apiPost } from "@/lib/api";

export type AuthUser = { id: number; email: string; name: string };

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  isAuthed: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  register: (name: string, email: string, password: string) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiGet<{ user: AuthUser | null }>("/api/auth/me");
      setUser(res?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await apiPost<{ user: AuthUser | null }>("/api/auth/login", { email, password });
    setUser(res?.user ?? null);
    return res?.user ?? null;
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiPost<{ user: AuthUser | null }>("/api/auth/register", { name, email, password });
    setUser(res?.user ?? null);
    return res?.user ?? null;
  }

  async function logout() {
    await apiPost("/api/auth/logout", {});
    setUser(null);
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthCtx = React.useMemo(
    () => ({
      user,
      loading,
      isAuthed: !!user,
      refresh,
      login,
      register,
      logout,
    }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}