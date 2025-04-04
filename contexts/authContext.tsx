import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

type AuthContextData = {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  login: (token: string, user: any) => void;
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

  // Verificar autenticação ao iniciar o app
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
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função para login
  const login = async (token: string, user: any) => {
    setToken(token);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("userData", JSON.stringify(user));
  };

  // Função para logout
  const logout = async () => {
    setToken(null); // Limpa o token
    setIsAuthenticated(false); // Atualiza o estado de autenticação
    await AsyncStorage.clear(); // Limpa todos os dados do AsyncStorage
    router.push("/login"); // Redireciona para a tela de login
  };

  // Redirecionamento condicional
  useEffect(() => {
    if (!loading) {
      // Só faz o redirecionamento quando o loading for `false`
      if (!isAuthenticated) {
        router.push("/login"); // Se não estiver autenticado, vai para a tela de login
      } else {
        router.push("/welcome"); // Se autenticado, vai para a tela de boas-vindas
      }
    }
  }, [loading, isAuthenticated, router]); // Dependências de redirecionamento

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, loading, login, logout }}
    >
      {children} {/* Renderiza os filhos do AuthProvider */}
    </AuthContext.Provider>
  );
};

// Hook para acessar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
