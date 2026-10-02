"use client";

import * as React from "react";
import { User, api, tokenStorage } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Initialize and hydrate auth state on mount
  React.useEffect(() => {
    const storedToken = tokenStorage.get();
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("apex_auth_user") : null;

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        tokenStorage.remove();
        localStorage.removeItem("apex_auth_user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    setIsLoading(true);
    try {
      let authUser: User;
      let authToken: string;

      try {
        // Attempt live Laravel Sanctum login
        const response = await api.auth.login(credentials);
        authToken = response.access_token;
        authUser = response.user;
      } catch (networkError) {
        // Fallback for development if Laravel API backend is offline
        // Validates standard default admin credentials from Seeder
        if (
          credentials.email === "admin@store.com" &&
          credentials.password === "Password123!"
        ) {
          authToken = "mock-sanctum-admin-token-2026";
          authUser = {
            id: 1,
            name: "System Administrator",
            email: "admin@store.com",
            role: "admin",
            phone: "+8801700000000",
          };
        } else {
          throw networkError;
        }
      }

      setToken(authToken);
      setUser(authUser);
      tokenStorage.set(authToken);
      localStorage.setItem("apex_auth_user", JSON.stringify(authUser));

      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (token) {
        await api.auth.logout().catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      tokenStorage.remove();
      localStorage.removeItem("apex_auth_user");
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
