import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";

type AuthContextData = {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextData | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");

        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);
        } else {
          setToken(null);
          setIsAuthenticated(false);

          if (segments[0] !== "login") {
            setTimeout(() => router.push("/login"), 0);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setToken(null);
        setIsAuthenticated(false);

        if (segments[0] !== "login") {
          setTimeout(() => router.push("/login"), 0);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [segments]);

  const logout = async () => {
    try {
      await AsyncStorage.clear(); // Limpa todos os dados do AsyncStorage
      setToken(null);
      setIsAuthenticated(false);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, loading, logout }}>
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
