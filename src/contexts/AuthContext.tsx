import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost, setToken } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Session {
  access_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tt_jwt');
    if (!token) {
      setLoading(false);
      return;
    }
    apiGet('/api/auth/me')
      .then((u: User) => {
        setUser(u);
        setSession({ access_token: token, user: u });
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    try {
      await apiPost('/api/auth/logout', {});
    } catch {
      // stateless — ignore errors
    }
    setToken(null);
    setUser(null);
    setSession(null);
  };

  const login = async (email: string, password: string) => {
    const { token, user: u } = await apiPost('/api/auth/login', { email, password }) as { token: string; user: User };
    setToken(token);
    setUser(u);
    setSession({ access_token: token, user: u });
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const { token, user: u } = await apiPost('/api/auth/register', { email, password, displayName }) as { token: string; user: User };
    setToken(token);
    setUser(u);
    setSession({ access_token: token, user: u });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, login, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
