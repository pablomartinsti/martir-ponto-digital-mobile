// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

type UserData = {
  id: string;
  name: string;
  role: string;
};

type AuthContextData = {
  isAuthenticated: boolean;
  token: string | null;
  user: UserData | null;
  loading: boolean;
  login: (token: string, user: UserData) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextData | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verifica autenticação ao iniciar o app
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem("userData");

        console.log("✅ Dados parseados:", storedUserData);

        if (storedUserData) {
          console.log("🔎 Dados brutos do AsyncStorage:", storedUserData);

          const parsed = JSON.parse(storedUserData);

          setToken(parsed.token); // pega o token separado
          setUser({
            id: parsed.id,
            name: parsed.name,
            role: parsed.role,
          }); // apenas os dados do usuário
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função para login
  const login = async (token: string, user: UserData) => {
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("userData", JSON.stringify({ token, ...user }));
  };

  // Função para logout
  const logout = async () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.clear();
    router.push("/login");
  };

  // Redirecionamento condicional
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        router.push("/welcome");
      }
    }
  }, [loading, isAuthenticated, router]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
