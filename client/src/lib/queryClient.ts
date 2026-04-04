// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { useGlobalLoading } from "../hooks/useGlobalLoading";

// URL do backend no Render
// Usa fallback para desenvolvimento local
const API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL 
  ? import.meta.env.VITE_API_URL 
  : '';

// Contador para controlar múltiplas requisições
let activeRequests = 0;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
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
  const shouldShowLoading = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  
  if (shouldShowLoading) {
    setGlobalLoading(true);
  }
  
  try {
    const url = `${API_URL}/api${path}`;
    console.log(`[API] ${method} ${url}`);
    
    const res = await fetch(url, {
      method,
      headers: isForm ? {} : body ? { "Content-Type": "application/json" } : {},
      credentials: "include",
      body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });

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