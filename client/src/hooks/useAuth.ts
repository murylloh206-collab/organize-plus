import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

export interface AuthUser {
  userId: number;
  role: "admin" | "aluno";
  salaId: number | null;
}

export function useAuth() {
  const qc = useQueryClient();

  const { data: auth, isLoading } = useQuery<AuthUser>({
    queryKey: ["auth-me"],
    queryFn: () => apiRequest("GET", "/auth/me"),
    retry: false,
    staleTime: Infinity,
  });

  const login = useMutation({
    mutationFn: (data: { email: string; senha: string }) =>
      apiRequest("POST", "/auth/login", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });

  const register = useMutation({
    mutationFn: (data: unknown) => apiRequest("POST", "/auth/register", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });

  const registerAluno = useMutation({
    mutationFn: (data: unknown) => apiRequest("POST", "/auth/register-aluno", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });

  const registerComissao = useMutation({
    mutationFn: (data: { nome: string; email: string; senha: string; celular?: string }) =>
      apiRequest("POST", "/auth/register-comissao", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(["auth-me"], null);
      qc.clear();
      window.location.href = "/";
    },
  });

  const validateChave = useMutation({
    mutationFn: (chave: string) => apiRequest("POST", "/auth/validate-chave", { chave }),
  });

  return { auth, isLoading, login, register, registerAluno, registerComissao, logout, validateChave };
}
