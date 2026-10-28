import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import AuthService from "../services/authService";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (AuthService.isAuthenticated()) {
        return AuthService.getCurrentUser() ?? null;
      }
    } catch {
}
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (AuthService.isAuthenticated()) {
          const currentUser = AuthService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            AuthService.logout();
            setUser(null);
          }
        } else {
          AuthService.logout();
          setUser(null);
        }
      } catch {
        AuthService.logout();
        setUser(null);
      }
      setIsLoading(false);
    };

    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener("auth:logout", handleLogout);
    initializeAuth();

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await AuthService.login(email, password);

      if (response.token) {
        const currentUser = AuthService.getCurrentUser();
        const { token, ...userData } = response;
        setUser({
          ...userData,
          email: response.email || email,
          ...(currentUser || {}),
        });
        return true;
      }

      return false;
    } catch (error: any) {
      throw new Error(error.message || "Login failed. Please try again.");
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
      window.location.href = "/login";
    }
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};
