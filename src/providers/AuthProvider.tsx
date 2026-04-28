import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext, DEMO_ACCOUNTS, type User } from "@/lib/auth";

const STORAGE_KEY = "urbansim_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 800));

    const demo = DEMO_ACCOUNTS.find((a) => a.email === email && a.password === password);
    if (demo) {
      const { password: _pw, ...safeUser } = demo;
      setUser(safeUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      return { success: true };
    }

    try {
      const registered = JSON.parse(
        localStorage.getItem("urbansim_registered_users") ?? "[]",
      ) as (User & { password: string })[];
      const found = registered.find((u) => u.email === email && u.password === password);
      if (found) {
        const { password: _pw, ...safeUser } = found;
        setUser(safeUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
        return { success: true };
      }
    } catch {}

    return { success: false, error: "Invalid email or password." };
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, city: string) => {
      await new Promise((r) => setTimeout(r, 800));

      if (DEMO_ACCOUNTS.find((a) => a.email === email)) {
        return { success: false, error: "Email already in use." };
      }

      try {
        const existing = JSON.parse(
          localStorage.getItem("urbansim_registered_users") ?? "[]",
        ) as (User & { password: string })[];
        if (existing.find((u) => u.email === email)) {
          return { success: false, error: "Email already registered." };
        }

        const newUser: User & { password: string } = {
          id: `user-${Date.now()}`,
          name,
          email,
          password,
          role: "operator",
          city: city || "Unknown City",
          avatar: name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
        };

        localStorage.setItem(
          "urbansim_registered_users",
          JSON.stringify([...existing, newUser]),
        );

        const { password: _pw, ...safeUser } = newUser;
        setUser(safeUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
        return { success: true };
      } catch {
        return { success: false, error: "Registration failed. Try again." };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
