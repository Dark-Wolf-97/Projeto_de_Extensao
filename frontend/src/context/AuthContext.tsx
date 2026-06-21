import { createContext, useContext, useEffect, useState } from 'react';
import type { Role } from '@/services/AuthService';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
  isAdmin: () => boolean;
  isSecretaria: () => boolean;
  isMedico: () => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = (userData: AuthUser, jwt: string) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwt);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isSecretaria = () => user?.role === 'SECRETARIA';
  const isMedico = () => user?.role === 'MEDICO';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAdmin, isSecretaria, isMedico }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
