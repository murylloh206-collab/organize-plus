import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";

export default function AdminRanking() {
  const { data: alunos = [] } = useQuery({ queryKey: ["alunos"], queryFn: () => apiRequest("GET", "/alunos") });
  const { data: pagamentos = [] } = useQuery({ queryKey: ["pagamentos"], queryFn: () => apiRequest("GET", "/pagamentos") });

  const ranking = alunos.map((a: any) => {
    const pags = pagamentos.filter((p: any) => p.pagamento?.usuarioId === a.id);
    const total = pags.reduce((s: number, p: any) => s + parseFloat(p.pagamento?.valor || "0"), 0);
    const pagos = pags.filter((p: any) => p.pagamento?.status === "pago").length;
    return { ...a, totalPago: total, qtdPagamentos: pagos };
  }).sort((a: any, b: any) => b.totalPago - a.totalPago);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Ranking" />
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold">Ranking de Alunos</h3>
            <p className="text-sm text-slate-500">Por total de pagamentos realizados</p>
          </div>

          {/* Top 3 */}
          {ranking.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {ranking.slice(0, 3).map((a: any, i: number) => (
                <div key={a.id} className={`card p-6 text-center ${i === 0 ? "border-yellow-300 dark:border-yellow-600/50 shadow-lg" : ""}`}>
                  <div className="text-4xl mb-3">{medals[i]}</div>
                  <div className="size-14 rounded-full bg-primary mx-auto flex items-center justify-center text-white font-black text-xl mb-3">
                    {a.nome?.charAt(0)}
                  </div>
                  <p className="font-bold">{a.nome}</p>
                  <p className="text-lg font-black text-primary mt-1">{fmt(a.totalPago)}</p>
                  <p className="text-xs text-slate-500">{a.qtdPagamentos} pagamentos</p>
                </div>
              ))}
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {["#", "Aluno", "Pagamentos", "Total Pago"].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ranking.map((a: any, i: number) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400 text-sm">
                      {i < 3 ? medals[i] : `#${i + 1}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{a.nome?.charAt(0)}</div>
                        <span className="font-semibold text-sm">{a.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{a.qtdPagamentos}</td>
                    <td className="px-6 py-4 font-bold text-primary">{fmt(a.totalPago)}</td>
                  </tr>
                ))}
                {ranking.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhum dado disponível.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
