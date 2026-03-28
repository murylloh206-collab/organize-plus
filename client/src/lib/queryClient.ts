// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { useGlobalLoading } from "../hooks/useGlobalLoading";

// Contador para controlar múltiplas requisições
let activeRequests = 0;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Função para gerenciar loading global
function setGlobalLoading(loading: boolean) {
  try {
    const { setLoading } = useGlobalLoading.getState();
    
    if (loading) {
      activeRequests++;
      setLoading(true);
    } else {
      activeRequests--;
      if (activeRequests <= 0) {
        activeRequests = 0;
        setLoading(false);
      }
    }
  } catch (error) {
    // Fallback caso o hook não esteja disponível
    console.warn("Global loading não disponível");
  }
}

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  isFormData?: boolean
) {
  const isForm = isFormData || body instanceof FormData;
  
  // Só mostra loading para métodos que modificam dados
  const shouldShowLoading = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  
  if (shouldShowLoading) {
    setGlobalLoading(true);
  }
  
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers: isForm ? {} : body ? { "Content-Type": "application/json" } : {},
      credentials: "include",
      body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });

    // Para respostas 204 (No Content), retornar null em vez de tentar parsear JSON
    if (res.status === 204) {
      return null;
    }

    if (!res.ok) {
      let errorMessage;
      try {
        const errData = await res.json();
        errorMessage = errData.message || errData.error || res.statusText;
      } catch {
        errorMessage = res.statusText || "Erro na requisição";
      }
      throw new Error(errorMessage);
    }

    // Para métodos que normalmente não retornam corpo
    if (method === "DELETE") {
      return null;
    }

    return res.json();
  } finally {
    if (shouldShowLoading) {
      setGlobalLoading(false);
    }
  }
}