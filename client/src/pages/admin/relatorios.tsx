import { useQuery } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileMetricCard from "../../components/ui/MobileMetricCard";
import Skeleton from "../../components/ui/Skeleton";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

export default function AdminRelatorios() {
  const { auth } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["relatorio-stats", auth?.salaId],
    queryFn: () => apiRequest("GET", `/dashboard/stats?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const { data: pagamentos = [], isLoading: pagLoading } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: () => apiRequest("GET", "/pagamentos"),
  });

  const { data: alunos = [], isLoading: alunosLoading } = useQuery({
    queryKey: ["alunos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/alunos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const isLoading = statsLoading || pagLoading || alunosLoading;

  const pagamentosFlat = pagamentos.map((item: any) => item.pagamento ?? item);

  const pagos    = pagamentosFlat.filter((p: any) => p.status === "pago");
  const pendentes= pagamentosFlat.filter((p: any) => p.status === "pendente");
  const hoje = new Date();
  const atrasados= pagamentosFlat.filter((p: any) => p.status !== "pago" && p.dataVencimento && new Date(p.dataVencimento) < hoje);

  const totalArrecadado = pagos.reduce((s: number, p: any) => s + (parseFloat(p.valor) || 0), 0);
  const totalPendente   = pendentes.reduce((s: number, p: any) => s + (parseFloat(p.valor) || 0), 0);
  const totalAtrasado   = atrasados.reduce((s: number, p: any) => s + (parseFloat(p.valor) || 0), 0);

  return (
    <MobileLayout role="admin">
      <MobileHeader title="Relatórios" subtitle="Visão geral financeira" gradient />

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} variant="metric" />)}</div>
        ) : (
          <>
            {/* Métricas principais */}
            <div className="grid grid-cols-2 gap-3">
              <MobileMetricCard title="Total Arrecadado" value={formatCurrency(totalArrecadado)} icon="account_balance_wallet" color="green" subtitle={`${pagos.length} pagtos`} />
              <MobileMetricCard title="Pendente" value={formatCurrency(totalPendente)} icon="pending_actions" color="amber" subtitle={`${pendentes.length} faturas`} />
              <MobileMetricCard title="Atrasado" value={formatCurrency(totalAtrasado)} icon="warning" color="rose" subtitle={`${atrasados.length} faturas`} />
              <MobileMetricCard title="Alunos" value={String(alunos.length)} icon="school" color="primary" />
            </div>

            {/* Taxa de adimplência */}
            <MobileCard>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Taxa de Adimplência</h3>
              {(() => {
                const total = pagamentosFlat.length;
                const taxa = total > 0 ? (pagos.length / total) * 100 : 0;
                const taxaPendente = total > 0 ? (pendentes.length / total) * 100 : 0;
                const taxaAtrasada = total > 0 ? (atrasados.length / total) * 100 : 0;
                return (
                  <div className="space-y-3">
                    {[
                      { label: "Pagos", value: taxa, color: "bg-emerald-500", count: pagos.length },
                      { label: "Pendentes", value: taxaPendente, color: "bg-amber-400", count: pendentes.length },
                      { label: "Atrasados", value: taxaAtrasada, color: "bg-red-500", count: atrasados.length },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                          <span>{item.label} ({item.count})</span>
                          <span className="font-bold">{item.value.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${item.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </MobileCard>

            {/* Últimos pagamentos */}
            <MobileCard>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Últimas Transações</h3>
              {pagamentosFlat.length > 0 ? (
                <div className="space-y-2">
                  {[...pagamentosFlat]
                    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .slice(0, 5)
                    .map((p: any) => {
                      const aluno = alunos.find((a: any) => a.id === p.usuarioId);
                      return (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{aluno?.nome || "Aluno"}</p>
                            <p className="text-xs text-slate-500">{p.descricao} • {formatDate(p.dataVencimento)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(parseFloat(p.valor) || 0)}</p>
                            <span className={`text-xs font-semibold ${p.status === "pago" ? "text-emerald-600" : p.status === "pendente" ? "text-amber-600" : "text-red-500"}`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Nenhuma transação</p>
              )}
            </MobileCard>
          </>
        )}
      </div>
    </MobileLayout>
  );
}