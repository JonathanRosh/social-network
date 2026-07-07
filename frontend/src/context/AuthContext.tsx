import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth.js";
import type { SessionUser } from "../api/types.js";

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  loginError: string | null;
  registerError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const { user } = await authApi.getMe();
        return user;
      } catch {
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => queryClient.setQueryData(["me"], user),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user }) => queryClient.setQueryData(["me"], user),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => queryClient.setQueryData(["me"], null),
  });

  const value: AuthContextValue = {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    login: async (input) => {
      await loginMutation.mutateAsync(input);
    },
    register: async (input) => {
      await registerMutation.mutateAsync(input);
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    loginError: loginMutation.error?.message ?? null,
    registerError: registerMutation.error?.message ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
