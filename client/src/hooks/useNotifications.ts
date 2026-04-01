import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "./useAuth";

export interface Notificacao {
  id: number;
  alunoId: number;
  titulo: string;
  mensagem: string;
  tipo: "pagamento" | "rifa" | "sistema";
  lida: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { auth } = useAuth();
  const qc = useQueryClient();

  const {
    data: notificacoes = [],
    isLoading,
    refetch,
  } = useQuery<Notificacao[]>({
    queryKey: ["notificacoes"],
    queryFn: () => apiRequest("GET", "/notificacoes"),
    enabled: !!auth,
    refetchInterval: 30000, // Polling a cada 30s
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["notificacoes-count"],
    queryFn: () => apiRequest("GET", "/notificacoes/nao-lidas"),
    enabled: !!auth,
    refetchInterval: 30000,
  });

  const naoLidas = countData?.count ?? 0;

  const marcarComoLida = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/notificacoes/${id}/lida`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificacoes"] });
      qc.invalidateQueries({ queryKey: ["notificacoes-count"] });
    },
  });

  const marcarTodasLidas = useMutation({
    mutationFn: () => apiRequest("PUT", "/notificacoes/marcar-todas-lidas"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificacoes"] });
      qc.invalidateQueries({ queryKey: ["notificacoes-count"] });
    },
  });

  return {
    notificacoes,
    naoLidas,
    isLoading,
    refetch,
    marcarComoLida,
    marcarTodasLidas,
  };
}
