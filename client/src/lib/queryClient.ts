import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  isFormData?: boolean
) {
  const isForm = isFormData || body instanceof FormData;

  const res = await fetch(`/api${path}`, {
    method,
    // Não setar Content-Type para FormData — o browser inclui o boundary automaticamente
    headers: isForm ? {} : body ? { "Content-Type": "application/json" } : {},
    credentials: "include",
    body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errData.message || "Erro na requisição");
  }

  return res.json();
}
