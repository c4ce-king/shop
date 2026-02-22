"use client";

import * as React from "react";
import { apiGet, apiPost } from "@/lib/api";

export type AuthUser = { id: number; email: string; name: string };

export function useAuth() {
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

  return {
    user,
    loading,
    isAuthed: !!user,
    refresh,
    login,
    register,
    logout,
  };
}