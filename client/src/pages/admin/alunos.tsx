import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

export default function AdminAlunos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState(""); const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const { data: alunos = [] } = useQuery({ queryKey: ["alunos"], queryFn: () => apiRequest("GET", "/alunos") });

  const criar = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/alunos", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alunos"] }); setShowForm(false); setNome(""); setEmail(""); setSenha(""); },
    onError: (e: any) => setError(e.message),
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Alunos" />
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Gerenciar Alunos</h3>
              <p className="text-sm text-slate-500">{alunos.length} alunos cadastrados</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person_add</span> Adicionar Aluno
            </button>
          </div>

          {showForm && (
            <div className="card p-6 space-y-4">
              <h4 className="font-bold">Novo Aluno</h4>
              <div className="grid grid-cols-3 gap-4">
                <input className="input" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
                <input className="input" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="input" type="password" placeholder="Senha temporária" value={senha} onChange={e => setSenha(e.target.value)} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => criar.mutate({ nome, email, senha })} disabled={criar.isPending} className="btn-primary">
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
                  {["Aluno", "E-mail", "Cadastro", ""].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {alunos.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                          {a.nome?.charAt(0)}
                        </div>
                        <span className="font-semibold text-sm">{a.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{a.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="badge-success">Ativo</span>
                    </td>
                  </tr>
                ))}
                {alunos.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhum aluno cadastrado ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
