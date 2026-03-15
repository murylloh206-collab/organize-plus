import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

export default function AdminEventos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState(""); const [descricao, setDescricao] = useState(""); const [data, setData] = useState(""); const [local, setLocal] = useState("");

  const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => apiRequest("GET", "/eventos") });

  const criar = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/eventos", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["eventos"] }); setShowForm(false); setTitulo(""); setDescricao(""); setData(""); setLocal(""); },
  });

  const deletar = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/eventos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const statusBadge = (s: string) => {
    if (s === "planejado") return <span className="badge-warning">Planejado</span>;
    if (s === "realizado") return <span className="badge-success">Realizado</span>;
    return <span className="badge-danger">Cancelado</span>;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Eventos" />
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Agenda de Eventos</h3>
              <p className="text-sm text-slate-500">{eventos.length} eventos</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> Novo Evento
            </button>
          </div>

          {showForm && (
            <div className="card p-6 space-y-4">
              <h4 className="font-bold">Criar Evento</h4>
              <div className="grid grid-cols-2 gap-4">
                <input className="input" placeholder="Título" value={titulo} onChange={e => setTitulo(e.target.value)} />
                <input className="input" placeholder="Local" value={local} onChange={e => setLocal(e.target.value)} />
                <input className="input" type="datetime-local" value={data} onChange={e => setData(e.target.value)} />
                <input className="input" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => criar.mutate({ titulo, descricao, local, data })} disabled={criar.isPending} className="btn-primary">
                  {criar.isPending ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventos.map((ev: any) => (
              <div key={ev.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">event</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(ev.status)}
                    <button onClick={() => deletar.mutate(ev.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-lg">{ev.titulo}</h4>
                {ev.data && <p className="text-sm text-slate-500 mt-1">{new Date(ev.data).toLocaleString("pt-BR")}</p>}
                {ev.local && <p className="text-sm text-primary mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{ev.local}</p>}
                {ev.descricao && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{ev.descricao}</p>}
              </div>
            ))}
            {eventos.length === 0 && <div className="col-span-3 text-center py-12 text-slate-400">Nenhum evento criado ainda.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
