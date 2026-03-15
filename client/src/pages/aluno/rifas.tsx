import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

export default function AlunoRifas() {
  const { auth } = useAuth();
  const qc = useQueryClient();
  const [selectedRifa, setSelectedRifa] = useState<any>(null);
  const [compradorNome, setCompradorNome] = useState(""); const [compradorContato, setCompradorContato] = useState("");

  const { data: rifas = [] } = useQuery({ queryKey: ["rifas"], queryFn: () => apiRequest("GET", "/rifas"), enabled: !!auth });
  const { data: meusTickets = [] } = useQuery({ queryKey: ["meus-tickets"], queryFn: () => apiRequest("GET", "/rifas/meus-tickets"), enabled: !!auth });

  const vender = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/rifas/${selectedRifa.id}/tickets`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["meus-tickets"] }); setSelectedRifa(null); setCompradorNome(""); setCompradorContato(""); },
  });

  const fmt = (v: string | number) => parseFloat(String(v)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex min-h-screen">
      <Sidebar role="aluno" />
      <main className="flex-1 ml-64 p-8 space-y-6">
        <div>
          <h2 className="text-3xl font-black">Minhas Rifas</h2>
          <p className="text-slate-500">Venda tickets e acompanhe seus resultados.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rifas.filter((r: any) => r.status === "ativa").map((rifa: any) => (
            <div key={rifa.id} className="card p-6">
              <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">confirmation_number</span>
              </div>
              <h4 className="font-bold text-lg">{rifa.nome}</h4>
              <p className="text-sm text-slate-500 mb-2">Prêmio: {rifa.premio}</p>
              <p className="text-2xl font-black text-primary mb-4">{fmt(rifa.preco)}</p>
              <button onClick={() => setSelectedRifa(rifa)} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span> Registrar Venda
              </button>
            </div>
          ))}
        </div>

        {meusTickets.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold">Histórico de Vendas</h4>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {["Rifa", "Comprador", "Valor", "Status"].map(h => (
                    <th key={h} className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {meusTickets.map((t: any) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-sm font-semibold">Ticket #{t.id}</td>
                    <td className="px-6 py-4 text-sm">{t.compradorNome}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{fmt(t.valor)}</td>
                    <td className="px-6 py-4">
                      <span className={t.status === "pago" ? "badge-success" : "badge-warning"}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de venda */}
        {selectedRifa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="card p-6 w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold">Registrar Venda — {selectedRifa.nome}</h4>
                <button onClick={() => setSelectedRifa(null)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Nome do Comprador</label>
                <input className="input" placeholder="Nome completo" value={compradorNome} onChange={e => setCompradorNome(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Contato (opcional)</label>
                <input className="input" placeholder="Telefone ou e-mail" value={compradorContato} onChange={e => setCompradorContato(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => vender.mutate({ compradorNome, compradorContato, valor: selectedRifa.preco })}
                  disabled={vender.isPending || !compradorNome}
                  className="btn-primary flex-1"
                >
                  {vender.isPending ? "Salvando..." : "Confirmar Venda"}
                </button>
                <button onClick={() => setSelectedRifa(null)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
