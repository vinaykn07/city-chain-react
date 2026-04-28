import { createContext, useContext } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  city: string;
  avatar: string;
};

export type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    city: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// Demo accounts — always available
export const DEMO_ACCOUNTS = [
  {
    id: "demo-admin",
    name: "Alex Reyes",
    email: "admin@urbansim.city",
    password: "admin123",
    role: "admin" as const,
    city: "Metropolis Bay",
    avatar: "AR",
  },
  {
    id: "demo-operator",
    name: "Jordan Kim",
    email: "operator@urbansim.city",
    password: "ops123",
    role: "operator" as const,
    city: "Nova District",
    avatar: "JK",
  },
];
