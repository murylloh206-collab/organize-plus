import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";

function StatCard({ label, value, icon, trend, trendText }: { label: string; value: string; icon: string; trend?: string; trendText?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{value}</h3>
        </div>
        <div className="p-2.5 bg-[#0F3B7A]/5 text-[#0F3B7A] rounded-lg transition-colors group-hover:bg-[#0F3B7A] group-hover:text-white">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-sm">trending_up</span> {trend}
          </span>
          <span className="text-slate-400 text-[11px]">{trendText || "vs mês passado"}</span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { auth } = useAuth();
  
  // Buscar dados reais do dashboard
const { data: stats, isLoading: statsLoading } = useQuery({
  queryKey: ["dashboard-stats", auth?.salaId],
  queryFn: async () => {
    if (!auth?.salaId) {
      return {
        totalArrecadado: 0,
        totalAlunos: 0,
        totalTickets: 0,
        saldoCaixa: 0,
        variacaoArrecadado: 0,
        variacaoAlunos: 0,
        variacaoRifas: 0
      };
    }
    const response = await apiRequest("GET", `/dashboard/stats?salaId=${auth.salaId}`);
    return response;
  },
  enabled: !!auth?.userId,
});

// Buscar pagamentos recentes
const { data: pagamentos, isLoading: pagamentosLoading } = useQuery({
  queryKey: ["pagamentos-recentes", auth?.salaId],
  queryFn: async () => {
    if (!auth?.salaId) return [];
    const response = await apiRequest("GET", `/dashboard/recentes?salaId=${auth.salaId}&limite=8`);
    return response;
  },
  enabled: !!auth?.userId,
});

// Buscar dados da meta da formatura
const { data: metaData } = useQuery({
  queryKey: ["meta-formatura", auth?.salaId],
  queryFn: async () => {
    if (!auth?.salaId) {
      return { metaTotal: 0, arrecadado: 0, percentual: 0 };
    }
    const response = await apiRequest("GET", `/dashboard/formatura?salaId=${auth.salaId}`);
    return response;
  },
  enabled: !!auth?.userId,
});

// Buscar receita mensal
const { data: receitaMensal } = useQuery({
  queryKey: ["receita-mensal", auth?.salaId],
  queryFn: async () => {
    if (!auth?.salaId) {
      return {
        meses: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
        valores: [0, 0, 0, 0, 0, 0],
        mesAtual: new Date().getMonth()
      };
    }
    const response = await apiRequest("GET", `/dashboard/mensal?salaId=${auth.salaId}`);
    return response;
  },
  enabled: !!auth?.userId,
});

  const totalArrecadado = stats?.totalArrecadado ?? 0;
  const totalAlunos = stats?.totalAlunos ?? 0;
  const totalTickets = stats?.totalTickets ?? 0;
  const saldo = stats?.saldoCaixa ?? 0;

  const metaTotal = metaData?.metaTotal ?? 0;
  const metaArrecadado = metaData?.arrecadado ?? 0;
  const percentualMeta = metaData?.percentual ?? 0;
  const restante = metaTotal - metaArrecadado;

  // Dados do gráfico mensal
  const meses = receitaMensal?.meses ?? ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const valores = receitaMensal?.valores ?? [0, 0, 0, 0, 0, 0];
  const mesAtual = receitaMensal?.mesAtual ?? new Date().getMonth();

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusBadge = (status: string) => {
    if (status === "pago" || status === "completed") 
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Pago</span>;
    if (status === "pendente" || status === "pending") 
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Pendente</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">Falhou</span>;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <Header title="Dashboard" />
        
        <div className="p-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Total Arrecadado" 
              value={statsLoading ? "..." : fmt(totalArrecadado)} 
              icon="account_balance_wallet" 
              trend={stats?.variacaoArrecadado ? `+${stats.variacaoArrecadado}%` : "+12.5%"} 
              trendText="vs mês passado"
            />
            <StatCard 
              label="Alunos Ativos" 
              value={statsLoading ? "..." : String(totalAlunos)} 
              icon="school" 
              trend={stats?.variacaoAlunos ? `+${stats.variacaoAlunos}%` : "+3.2%"} 
              trendText="desde início"
            />
            <StatCard 
              label="Rifas Vendidas" 
              value={statsLoading ? "..." : String(totalTickets)} 
              icon="confirmation_number" 
              trend={stats?.variacaoRifas ? `+${stats.variacaoRifas}%` : "+15.8%"} 
              trendText="da meta"
            />
            <StatCard 
              label="Saldo Caixa" 
              value={statsLoading ? "..." : fmt(saldo)} 
              icon="savings" 
            />
          </div>

          {/* Charts Section - 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Receita Mensal</h4>
                  <p className="text-xs text-slate-400 font-medium">Fluxo de caixa 2026</p>
                </div>
                <select className="text-xs font-semibold border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 px-3 focus:ring-[#0F3B7A] ring-offset-2">
                  <option>Últimos 6 meses</option>
                  <option>Ano 2026</option>
                </select>
              </div>
              <div className="flex items-end justify-between h-64 gap-4 pt-4">
                {meses.map((mes: string, i: number) => (
                  <div key={mes} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t relative flex items-end overflow-hidden h-full">
                      <div 
                        className={`w-full ${i === mesAtual ? 'bg-[#0F3B7A]' : 'bg-[#0F3B7A]/30 group-hover:bg-[#0F3B7A]'} transition-all duration-300`} 
                        style={{ height: `${valores[i]}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${i === mesAtual ? 'text-slate-900 dark:text-white' : 'text-slate-400'} uppercase`}>
                      {mes}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Graduation Goal Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
              <div className="w-full mb-6">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Meta da Formatura</h4>
                <p className="text-xs text-slate-400 font-medium">Objetivo de arrecadação</p>
              </div>
              <div className="relative size-48 flex items-center justify-center mb-8">
                <svg className="size-full transform -rotate-90">
                  <circle 
                    className="text-slate-100 dark:text-slate-800" 
                    cx="50%" cy="50%" fill="transparent" r="42%" 
                    stroke="currentColor" strokeWidth="12"
                  />
                  <circle 
                    className="text-[#0F3B7A]" 
                    cx="50%" cy="50%" fill="transparent" r="42%" 
                    stroke="currentColor" 
                    strokeDasharray="264" 
                    strokeDashoffset={264 * (1 - percentualMeta / 100)} 
                    strokeLinecap="round" 
                    strokeWidth="12"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-800 dark:text-white">{percentualMeta}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Arrecadado</span>
                </div>
              </div>
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Meta Total</span>
                  <span className="font-bold">{fmt(metaTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Arrecadado</span>
                  <span className="text-[#0F3B7A] font-bold">{fmt(metaArrecadado)}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-center text-xs text-slate-400 italic">
                    Restante: {fmt(restante)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payments Table */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Pagamentos Recentes</h4>
                <p className="text-xs text-slate-400 font-medium">Histórico de transações em tempo real</p>
              </div>
              <a href="/admin/pagamentos" className="text-[#0F3B7A] text-xs font-bold uppercase tracking-wide hover:underline transition-all">
                Ver todos
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    {["Aluno", "Valor", "Data", "Status", ""].map(h => (
                      <th key={h} className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagamentosLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                        Carregando pagamentos...
                      </td>
                    </tr>
                  ) : pagamentos && pagamentos.length > 0 ? (
                    pagamentos.map((row: any, idx: number) => (
                      <tr key={row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300">
                              {row.alunoNome?.charAt(0) || "A"}
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{row.alunoNome || "Aluno"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                          {fmt(parseFloat(row.valor || "0"))}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                          {row.data ? new Date(row.data).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {statusBadge(row.status || "pending")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-[#0F3B7A] transition-colors">
                            <span className="material-symbols-outlined text-lg">more_horiz</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
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