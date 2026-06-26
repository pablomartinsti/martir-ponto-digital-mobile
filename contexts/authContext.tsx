import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { isTokenExpired } from "@/utils/auth";
import {
  clearLogoutReason,
  clearStoredUserData,
  getLogoutReason,
  getStoredUserData,
  setStoredUserData,
} from "@/services/storageService";
import { AuthUser } from "@/types/auth";

type AuthContextData = {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUserData = await getStoredUserData();

        if (!storedUserData || isTokenExpired(storedUserData.token)) {
          await clearStoredUserData();
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        setToken(storedUserData.token);
        setUser({
          id: storedUserData.id,
          name: storedUserData.name,
          role: storedUserData.role,
          companyId: storedUserData.companyId,
          companyName: storedUserData.companyName,
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        await clearStoredUserData();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    await setStoredUserData({ token: newToken, ...newUser });
    router.replace("/welcome");
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    await clearStoredUserData();
    router.replace("/login");
  };

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const checkLogoutReason = async () => {
      const reason = await getLogoutReason();
      if (reason === "expired") {
        Alert.alert("Sessão expirada", "Faça login novamente.");
        await clearLogoutReason();
      }
    };

    if (!isAuthenticated && !loading) {
      checkLogoutReason();
    }
  }, [isAuthenticated, loading]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, loading, login, logout }}>
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
