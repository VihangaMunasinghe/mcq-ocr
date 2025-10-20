"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import axiosInstance from "../utils/axiosclient";

// Exact copy of backend UserResponse
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  verify_status: string;
  faculty_id: number | null;
  last_login?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      const response = await axiosInstance.get("/api/auth/me");

      const userData = response.data as User;
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await axiosInstance.post("/api/auth/login", { email, password });

      const response = await axiosInstance.get("/api/auth/me");

      const userData = response.data as User;
      setUser(userData);

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Login failed";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
    } catch {
      // Continue even if logout fails
    }
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        refreshUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
