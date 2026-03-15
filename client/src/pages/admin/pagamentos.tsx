import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useQuery as useAlunosQuery } from "@tanstack/react-query";

export default function AdminPagamentos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [descricao, setDescricao] = useState(""); const [valor, setValor] = useState(""); const [usuarioId, setUsuarioId] = useState(""); const [vencimento, setVencimento] = useState(""); const [error, setError] = useState("");

  const { data: pagamentos = [] } = useQuery({ queryKey: ["pagamentos"], queryFn: () => apiRequest("GET", "/pagamentos") });
  const { data: alunos = [] } = useQuery({ queryKey: ["alunos"], queryFn: () => apiRequest("GET", "/alunos") });

  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/pagamentos", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pagamentos"] }); setShowForm(false); },
    onError: (e: any) => setError(e.message),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, status }: any) => apiRequest("PATCH", `/pagamentos/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pagamentos"] }),
  });

  const fmt = (v: string | number) => parseFloat(String(v || "0")).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusBadge = (s: string) => {
    if (s === "pago") return <span className="badge-success">Pago</span>;
    if (s === "pendente") return <span className="badge-warning">Pendente</span>;
    return <span className="badge-danger">Atrasado</span>;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Pagamentos" />
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Gestão de Pagamentos</h3>
              <p className="text-sm text-slate-500">{pagamentos.length} registros</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> Lançar Pagamento
            </button>
          </div>

          {showForm && (
            <div className="card p-6 space-y-4">
              <h4 className="font-bold">Novo Pagamento</h4>
              <div className="grid grid-cols-2 gap-4">
                <select className="input" value={usuarioId} onChange={e => setUsuarioId(e.target.value)}>
                  <option value="">Selecionar aluno...</option>
                  {alunos.map((a: any) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <input className="input" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
                <input className="input" type="number" placeholder="Valor (R$)" value={valor} onChange={e => setValor(e.target.value)} />
                <input className="input" type="date" placeholder="Vencimento" value={vencimento} onChange={e => setVencimento(e.target.value)} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => criar.mutate({ descricao, valor: parseFloat(valor), usuarioId: parseInt(usuarioId), dataVencimento: vencimento })} disabled={criar.isPending} className="btn-primary">
                  {criar.isPending ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {["Aluno", "Descrição", "Valor", "Vencimento", "Status", "Ações"].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagamentos.map((row: any) => (
                  <tr key={row.pagamento?.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">{row.usuario?.nome?.charAt(0)}</div>
                        <span className="text-sm font-semibold">{row.usuario?.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{row.pagamento?.descricao}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{fmt(row.pagamento?.valor)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {row.pagamento?.dataVencimento ? new Date(row.pagamento.dataVencimento).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-6 py-4">{statusBadge(row.pagamento?.status)}</td>
                    <td className="px-6 py-4">
                      {row.pagamento?.status !== "pago" && (
                        <button
                          onClick={() => atualizar.mutate({ id: row.pagamento?.id, status: "pago" })}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Marcar pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {pagamentos.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhum pagamento.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
