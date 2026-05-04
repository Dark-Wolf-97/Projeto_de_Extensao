import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
  nome: string;
  email: string;
  cargo: string;
  avatarUrl?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (user?: Partial<AuthUser>) => void;
  logout: () => void;
}

const defaultUser: AuthUser = {
  nome: "Dr. João Pereira",
  email: "joao@isg.com",
  cargo: "Médico",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Joao%20Pereira&backgroundColor=1B4A44&textColor=ffffff",
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("isg.user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const login = (partial?: Partial<AuthUser>) => {
    const u = { ...defaultUser, ...(partial || {}) };
    setUser(u);
    localStorage.setItem("isg.user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("isg.user");
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
