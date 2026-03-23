import { useQuery } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import Skeleton from "../../components/ui/Skeleton";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";

export default function AlunoCaixa() {
  const { auth } = useAuth();
  
  const { data: movimentos = [], isLoading: movLoading } = useQuery({
    queryKey: ["caixa"],
    queryFn: () => apiRequest("GET", "/caixa"),
    enabled: !!auth,
  });
  
  const { data: saldoData, isLoading: saldoLoading } = useQuery({
    queryKey: ["caixa-saldo"],
    queryFn: () => apiRequest("GET", "/caixa/saldo"),
    enabled: !!auth,
  });

  const isLoading = movLoading || saldoLoading;

  return (
    <MobileLayout role="aluno">
      <MobileHeader title="Caixa Transparente" subtitle="Movimentações da Turma" gradient />

      <div className="px-4 py-4 space-y-4">
        {/* Saldo Principal */}
        <MobileCard variant="gradient" className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-2 text-white/80">
            <span className="material-symbols-outlined">account_balance</span>
            <p className="text-xs font-bold uppercase tracking-widest">Saldo Atual</p>
          </div>
          {isLoading ? (
            <div className="h-12 w-48 bg-white/20 rounded-xl animate-pulse mx-auto" />
          ) : (
            <p className="text-4xl font-black text-white">{formatCurrency(saldoData?.saldo ?? 0)}</p>
          )}
          <p className="text-[10px] text-white/60 mt-3 font-medium bg-white/10 inline-block px-3 py-1 rounded-full">
            Transparência em tempo real
          </p>
        </MobileCard>

        {/* Histórico */}
        <MobileCard className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Extrato de Movimentações</h4>
          </div>
          
          {isLoading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
            </div>
          ) : movimentos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">receipt_long</span>
              <p className="text-sm text-slate-500">Nenhuma movimentação registrada.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {movimentos.map((row: any, i: number) => {
                const isEntrada = row.mov?.tipo === "entrada";
                return (
                  <div key={row.mov?.id ?? i} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isEntrada ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"}`}>
                        <span className="material-symbols-outlined text-sm">{isEntrada ? "arrow_downward" : "arrow_upward"}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[160px]">{row.mov?.descricao}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">
                          {row.usuario?.nome && `${row.usuario.nome.split(" ")[0]} • `}
                          {row.mov?.data ? formatDate(row.mov.data) : ""}
                        </p>
                      </div>
                    </div>
                    <p className={`font-black text-sm shrink-0 ${isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isEntrada ? "+" : "-"}{formatCurrency(row.mov?.valor)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </MobileCard>
      </div>
    </MobileLayout>
  );
}
