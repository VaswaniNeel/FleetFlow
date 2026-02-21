import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, getToken, clearToken } from '../api/apiClient';

export type UserRole = 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';

interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
}

interface RoleContextType {
  user: User | null;
  authChecked: boolean;
  login: (name: string, email: string, role: UserRole) => void;
  logout: () => void;
  hasAccess: (allowedRoles: UserRole[]) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    apiClient
      .get<{ user: User }>('/auth/me')
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const login = (name: string, email: string, role: UserRole) => {
    setUser({ name, email, role });
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const hasAccess = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <RoleContext.Provider value={{ user, authChecked, login, logout, hasAccess }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
