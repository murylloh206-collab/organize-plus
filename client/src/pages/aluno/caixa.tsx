import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

export default function AlunoCaixa() {
  const { auth } = useAuth();
  const { data: movimentos = [] } = useQuery({ queryKey: ["caixa"], queryFn: () => apiRequest("GET", "/caixa"), enabled: !!auth });
  const { data: saldoData } = useQuery({ queryKey: ["caixa-saldo"], queryFn: () => apiRequest("GET", "/caixa/saldo"), enabled: !!auth });

  const fmt = (v: string | number) => parseFloat(String(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex min-h-screen">
      <Sidebar role="aluno" />
      <main className="flex-1 ml-64 p-8 space-y-6">
        <div>
          <h2 className="text-3xl font-black">Caixa Transparente</h2>
          <p className="text-slate-500">Toda movimentação financeira da turma, com total transparência.</p>
        </div>

        <div className="card p-8 text-center bg-gradient-to-br from-primary/10 to-transparent border-blue-200 dark:border-blue-800/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary">account_balance</span>
            <p className="text-sm font-bold uppercase text-slate-500 tracking-widest">Saldo Atual</p>
          </div>
          <p className="text-5xl font-black text-primary">{fmt(saldoData?.saldo ?? 0)}</p>
          <p className="text-sm text-slate-400 mt-2">Atualizado em tempo real</p>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h4 className="font-bold">Extrato de Movimentações</h4>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {movimentos.map((row: any, i: number) => (
              <div key={row.mov?.id ?? i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-full flex items-center justify-center ${row.mov?.tipo === "entrada" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"}`}>
                    <span className={`material-symbols-outlined text-sm ${row.mov?.tipo === "entrada" ? "text-emerald-600" : "text-rose-500"}`}>
                      {row.mov?.tipo === "entrada" ? "arrow_downward" : "arrow_upward"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{row.mov?.descricao}</p>
                    <p className="text-xs text-slate-500">
                      {row.usuario?.nome && `Por ${row.usuario.nome} • `}
                      {row.mov?.data ? new Date(row.mov.data).toLocaleDateString("pt-BR") : ""}
                    </p>
                  </div>
                </div>
                <p className={`font-black text-lg ${row.mov?.tipo === "entrada" ? "text-emerald-600" : "text-rose-500"}`}>
                  {row.mov?.tipo === "entrada" ? "+" : "-"}{fmt(row.mov?.valor)}
                </p>
              </div>
            ))}
            {movimentos.length === 0 && <div className="px-6 py-12 text-center text-slate-400">Nenhuma movimentação registrada.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
