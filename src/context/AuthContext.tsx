import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiJson, setAccessToken, tryRefresh } from "@/lib/api";

type User = { id: string; email: string };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean; // true only during the initial silent-refresh check on page load
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, the access token is gone (it only ever lived in memory),
  // so try the refresh cookie to silently restore the session.
  useEffect(() => {
    (async () => {
      const refreshed = await tryRefresh();
      if (refreshed) {
        try {
          const data = await apiJson<{ user: User }>("/auth/me");
          setUser(data.user);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const data = await apiJson<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function register(email: string, password: string) {
    const data = await apiJson<{ user: User; accessToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    await apiJson("/auth/logout", { method: "POST" });
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
