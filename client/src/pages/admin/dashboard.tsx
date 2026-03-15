import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

function StatCard({ label, value, icon, trend }: { label: string; value: string; icon: string; trend?: string }) {
  return (
    <div className="card p-6 relative overflow-hidden group transition-all hover:shadow-lg border-l-4 border-[#c6a43f]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
          <h3 className="text-3xl font-black mt-2 text-[#1e3a5f] dark:text-white">{value}</h3>
        </div>
        <div className="p-3 bg-[#c6a43f]/10 text-[#c6a43f] rounded-xl transition-all group-hover:bg-[#c6a43f] group-hover:text-white shadow-sm">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>{trend}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">vs mês passado</span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { auth } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiRequest("GET", "/alunos/dashboard-stats"),
    enabled: !!auth?.salaId,
  });

  const { data: pagamentos } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos"),
    enabled: !!auth?.salaId,
  });

  const totalArrecadado = stats?.totalArrecadado ?? 0;
  const totalAlunos = stats?.totalAlunos ?? 0;
  const totalTickets = stats?.totalTickets ?? 0;
  const saldo = stats?.saldoCaixa ?? 0;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusBadge = (status: string) => {
    if (status === "pago") return <span className="badge-success">Pago</span>;
    if (status === "pendente") return <span className="badge-warning">Pendente</span>;
    return <span className="badge-danger">Atrasado</span>;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Dashboard" />
        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Arrecadado" value={fmt(totalArrecadado)} icon="account_balance_wallet" trend="+12.5%" />
            <StatCard label="Alunos Ativos" value={String(totalAlunos)} icon="school" trend="+3.2%" />
            <StatCard label="Rifas Vendidas" value={String(totalTickets)} icon="confirmation_number" trend="+15.8%" />
            <StatCard label="Saldo Caixa" value={fmt(saldo)} icon="savings" />
          </div>

          {/* Recent payments */}
          <div className="card overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold">Pagamentos Recentes</h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Histórico de transações em tempo real</p>
              </div>
              <a href="/admin/pagamentos" className="text-primary text-xs font-bold uppercase tracking-wide hover:underline">
                Ver todos
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    {["Aluno", "Descrição", "Valor", "Data", "Status", ""].map(h => (
                      <th key={h} className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(pagamentos || []).slice(0, 8).map((row: any, idx: number) => (
                    <tr key={row.pagamento?.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50/50 dark:bg-slate-800/30'} hover:bg-[#c6a43f]/5 transition-colors group`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-[#1e3a5f] text-[#c6a43f] flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                            {row.usuario?.nome?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{row.usuario?.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{row.pagamento?.descricao}</td>
                      <td className="px-6 py-4 text-sm font-black text-[#1e3a5f] dark:text-white">{fmt(parseFloat(row.pagamento?.valor || "0"))}</td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-bold uppercase">
                        {row.pagamento?.dataPagamento ? new Date(row.pagamento.dataPagamento).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-6 py-4">{statusBadge(row.pagamento?.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg text-slate-300 hover:text-[#c6a43f] hover:bg-[#c6a43f]/10 transition-all opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!pagamentos || pagamentos.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        Nenhum pagamento registrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
