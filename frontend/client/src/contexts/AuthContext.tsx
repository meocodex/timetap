// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

// Interface para o usuário autenticado
interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
  avatar?: string;
  lastLogin?: string;
}

// Interface para credenciais de login
interface SignInCredentials {
  email: string;
  senha: string;
}

// Interface para o contexto de autenticação
interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  updateUser: (user: User) => void;
}

// Criação do contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Interface para as props do provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega dados da sessão armazenados
  useEffect(() => {
    async function loadStorageData() {
      const storedToken = localStorage.getItem('@Spartakus:token');
      const storedUser = localStorage.getItem('@Spartakus:user');

      if (storedToken && storedUser) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    }

    loadStorageData();
  }, []);

  // Função para realizar login
  const signIn = async ({ email, senha }: SignInCredentials) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha,
      });

      const { token, user } = response.data;

      localStorage.setItem('@Spartakus:token', token);
      localStorage.setItem('@Spartakus:user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  // Função para realizar logout
  const signOut = () => {
    localStorage.removeItem('@Spartakus:token');
    localStorage.removeItem('@Spartakus:user');
    api.defaults.headers.common['Authorization'] = '';
    setUser(null);
  };

  // Função para atualizar dados do usuário
  const updateUser = (userData: User) => {
    localStorage.setItem('@Spartakus:user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para facilitar o uso do contexto
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}