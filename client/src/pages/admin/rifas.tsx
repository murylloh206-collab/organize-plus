import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

export default function AdminRifas() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState(""); const [premio, setPremio] = useState(""); const [preco, setPreco] = useState(""); const [error, setError] = useState("");
  const [sorteando, setSorteando] = useState<number | null>(null);

  const { data: rifas = [] } = useQuery({ queryKey: ["rifas"], queryFn: () => apiRequest("GET", "/rifas") });

  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/rifas", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rifas"] }); setShowForm(false); setNome(""); setPremio(""); setPreco(""); },
    onError: (e: any) => setError(e.message),
  });

  const sortear = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/rifas/${id}/sortear`, {}),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["rifas"] }); setSorteando(null); alert(`🎉 Vencedor sorteado! Ticket #${data.vencedor?.id}`); },
    onError: (e: any) => { setSorteando(null); alert(e.message); },
  });

  const statusBadge = (s: string) => {
    if (s === "ativa") return <span className="badge-success">Ativa</span>;
    if (s === "encerrada") return <span className="badge-warning">Encerrada</span>;
    return <span className="badge-danger">Sorteada</span>;
  };

  const fmt = (v: string | number) => parseFloat(String(v)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Rifas" />
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Gerenciar Rifas</h3>
              <p className="text-sm text-slate-500">{rifas.length} rifas criadas</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> Nova Rifa
            </button>
          </div>

          {showForm && (
            <div className="card p-6 space-y-4">
              <h4 className="font-bold">Criar Rifa</h4>
              <div className="grid grid-cols-3 gap-4">
                <input className="input" placeholder="Nome da rifa" value={nome} onChange={e => setNome(e.target.value)} />
                <input className="input" placeholder="Prêmio" value={premio} onChange={e => setPremio(e.target.value)} />
                <input className="input" type="number" placeholder="Preço do ticket (R$)" value={preco} onChange={e => setPreco(e.target.value)} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => criar.mutate({ nome, premio, preco })} disabled={criar.isPending} className="btn-primary">
                  {criar.isPending ? "Salvando..." : "Criar Rifa"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rifas.map((r: any) => (
              <div key={r.id} className="card p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">confirmation_number</span>
                  </div>
                  {statusBadge(r.status)}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{r.nome}</h4>
                  <p className="text-sm text-slate-500">Prêmio: {r.premio}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xl font-black text-primary">{fmt(r.preco)}</p>
                  {r.status === "ativa" && (
                    <button
                      onClick={() => { setSorteando(r.id); sortear.mutate(r.id); }}
                      disabled={sorteando === r.id}
                      className="btn-primary py-1.5 px-3 text-xs"
                    >
                      {sorteando === r.id ? "Sorteando..." : "Sortear"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {rifas.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">Nenhuma rifa criada ainda.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
