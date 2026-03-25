import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileMetricCard from "../../components/ui/MobileMetricCard";
import MobileCard from "../../components/ui/MobileCard";
import MobileBadge from "../../components/ui/MobileBadge";
import MobileAvatar from "../../components/ui/MobileAvatar";
import ProgressCircle from "../../components/ui/ProgressCircle";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

export default function AdminDashboard() {
  const { auth } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", auth?.salaId],
    queryFn: async () => {
      if (!auth?.salaId) return { totalArrecadado: 0, totalAlunos: 0, totalTickets: 0, saldoCaixa: 0 };
      return apiRequest("GET", `/dashboard/stats?salaId=${auth.salaId}`);
    },
    enabled: !!auth?.userId,
  });

  const { data: pagamentos, isLoading: pagamentosLoading } = useQuery({
    queryKey: ["pagamentos-recentes", auth?.salaId],
    queryFn: async () => {
      if (!auth?.salaId) return [];
      return apiRequest("GET", `/dashboard/recentes?salaId=${auth.salaId}&limite=5`);
    },
    enabled: !!auth?.userId,
  });

  const { data: metaData } = useQuery({
    queryKey: ["meta-formatura", auth?.salaId],
    queryFn: async () => {
      if (!auth?.salaId) return { metaTotal: 0, arrecadado: 0, percentual: 0 };
      return apiRequest("GET", `/dashboard/formatura?salaId=${auth.salaId}`);
    },
    enabled: !!auth?.userId,
  });

  const { data: receitaMensal } = useQuery({
    queryKey: ["receita-mensal", auth?.salaId],
    queryFn: async () => {
      if (!auth?.salaId) return { meses: ["Jan","Fev","Mar","Abr","Mai","Jun"], valores: [0,0,0,0,0,0], mesAtual: 0 };
      return apiRequest("GET", `/dashboard/mensal?salaId=${auth.salaId}`);
    },
    enabled: !!auth?.userId,
  });

  const totalArrecadado  = stats?.totalArrecadado ?? 0;
  const totalAlunos      = stats?.totalAlunos ?? 0;
  const totalTickets     = stats?.totalTickets ?? 0;
  const saldo            = stats?.saldoCaixa ?? 0;
  const metaTotal        = metaData?.metaTotal ?? 0;
  const metaArrecadado   = metaData?.arrecadado ?? 0;
  const percentualMeta   = metaData?.percentual ?? 0;
  const meses = receitaMensal?.meses ?? ["Jan","Fev","Mar","Abr","Mai","Jun"];
  const valores = receitaMensal?.valores ?? [0,0,0,0,0,0];
  const mesAtual = receitaMensal?.mesAtual ?? new Date().getMonth();
  const maxValor = Math.max(...valores, 1);

  return (
    <MobileLayout role="admin">
      {/* Gradient Header - Versão arredondada com detalhe dourado */}
      <div className="relative bg-gradient-to-r from-[#1e3a5f] to-[#0f2a44] pt-12 pb-8 px-5 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/80 text-sm font-medium">Olá, Comissão</p>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">Dashboard</h1>
          </div>
          <Link
            to="/admin/configuracoes"
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-xl">settings</span>
          </Link>
        </div>
        {/* Linha dourada decorativa no centro */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-[#c6a43f] to-transparent rounded-full" />
      </div>

      <div className="px-4 -mt-3 space-y-4 pb-6">
        {/* Metric Cards 2x2 */}
        <div className="grid grid-cols-2 gap-3 animate-slide-in-bottom">
          <MobileMetricCard
            title="Arrecadado"
            value={statsLoading ? "..." : formatCurrency(totalArrecadado)}
            icon="account_balance_wallet"
            color="primary"
            loading={statsLoading}
          />
          <MobileMetricCard
            title="Alunos"
            value={statsLoading ? "..." : String(totalAlunos)}
            icon="school"
            color="blue"
            loading={statsLoading}
          />
          <MobileMetricCard
            title="Rifas Vendidas"
            value={statsLoading ? "..." : String(totalTickets)}
            icon="confirmation_number"
            color="purple"
            loading={statsLoading}
          />
          <MobileMetricCard
            title="Saldo Caixa"
            value={statsLoading ? "..." : formatCurrency(saldo)}
            icon="savings"
            color="green"
            loading={statsLoading}
          />
        </div>

        {/* Meta da Formatura */}
        <MobileCard className="animate-slide-in-bottom delay-75">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Meta da Formatura</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatCurrency(metaArrecadado)} de {formatCurrency(metaTotal)}
              </p>
            </div>
            <ProgressCircle value={percentualMeta} size={72} strokeWidth={7} color="#c6a43f" />
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-[#c6a43f] transition-all duration-700"
              style={{ width: `${Math.min(percentualMeta, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">
            Restante: {formatCurrency(metaTotal - metaArrecadado)}
          </p>
        </MobileCard>

        {/* Gráfico Mensal */}
        <MobileCard className="animate-slide-in-bottom delay-150">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Receita Mensal</h3>
              <p className="text-xs text-slate-400">Fluxo de caixa 2026</p>
            </div>
            <span className="badge-info text-xs">2026</span>
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {meses.map((mes: string, i: number) => {
              const height = maxValor > 0 ? (valores[i] / maxValor) * 100 : 0;
              return (
                <div key={mes} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex items-end" style={{ height: "88px" }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        i === mesAtual ? "bg-[#c6a43f]" : "bg-[#c6a43f]/40"
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-bold uppercase ${
                    i === mesAtual ? "text-[#c6a43f]" : "text-slate-400"
                  }`}>
                    {mes}
                  </span>
                </div>
              );
            })}
          </div>
        </MobileCard>

        {/* Ações Rápidas */}
        <div className="animate-slide-in-bottom delay-150">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Ações Rápidas
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: "person_add", label: "Aluno", to: "/admin/alunos", color: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" },
              { icon: "confirmation_number", label: "Rifa", to: "/admin/rifas", color: "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
              { icon: "payments", label: "Pag.", to: "/admin/pagamentos", color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
              { icon: "flag", label: "Meta", to: "/admin/metas", color: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1.5 group">
                <div className={`size-12 rounded-2xl flex items-center justify-center ${a.color} group-active:scale-95 transition-transform`}>
                  <span className="material-symbols-outlined text-xl">{a.icon}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Pagamentos Recentes */}
        <div className="animate-slide-in-bottom delay-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Pagamentos Recentes
            </p>
            <Link to="/admin/pagamentos" className="text-xs text-[#c6a43f] font-semibold">
              Ver todos
            </Link>
          </div>

          {pagamentosLoading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => (
                <div key={i} className="mobile-card p-3 flex items-center gap-3">
                  <div className="skeleton size-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 w-28" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                  <div className="skeleton h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : pagamentos && pagamentos.length > 0 ? (
            <div className="space-y-2">
              {pagamentos.map((row: any, idx: number) => (
                <div key={row.id || idx} className="mobile-list-item">
                  <MobileAvatar name={row.alunoNome || "A"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {row.alunoNome || "Aluno"}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(row.data)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(parseFloat(row.valor || "0"))}
                    </span>
                    <MobileBadge
                      variant={row.status === "pago" || row.status === "completed" ? "success" : row.status === "pendente" || row.status === "pending" ? "warning" : "danger"}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <MobileCard className="text-center py-8">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">receipt_long</span>
              <p className="text-sm text-slate-400 mt-2">Nenhum pagamento registrado</p>
            </MobileCard>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}