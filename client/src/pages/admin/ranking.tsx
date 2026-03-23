import { useQuery } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileAvatar from "../../components/ui/MobileAvatar";
import MobileBadge from "../../components/ui/MobileBadge";
import Skeleton from "../../components/ui/Skeleton";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";

interface RankingItem {
  alunoId: number;
  alunoNome: string;
  totalVendas: number;
  totalArrecadado: number;
  posicao: number;
}

export default function AdminRanking() {
  const { auth } = useAuth();

  const { data: ranking = [], isLoading } = useQuery<RankingItem[]>({
    queryKey: ["ranking", auth?.salaId],
    queryFn: () => apiRequest("GET", `/ranking?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const medalhaIcon = (pos: number) => {
    if (pos === 1) return { 
      icon: "emoji_events", 
      color: "text-amber-500", 
      bg: "bg-amber-50 dark:bg-amber-950/40",
      label: "🥇 Ouro"
    };
    if (pos === 2) return { 
      icon: "emoji_events", 
      color: "text-slate-400", 
      bg: "bg-slate-100 dark:bg-slate-800",
      label: "🥈 Prata"
    };
    if (pos === 3) return { 
      icon: "emoji_events", 
      color: "text-amber-700", 
      bg: "bg-amber-50/70 dark:bg-amber-950/20",
      label: "🥉 Bronze"
    };
    return { 
      icon: "person", 
      color: "text-slate-400", 
      bg: "bg-slate-50 dark:bg-slate-800/50",
      label: `${pos}º lugar`
    };
  };

  const top3 = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  return (
    <MobileLayout role="admin">
      <MobileHeader 
        title="Ranking" 
        subtitle="Melhores vendedores do mês" 
        gradient 
      />

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : ranking.length === 0 ? (
          <MobileCard className="text-center py-12">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">leaderboard</span>
            <p className="text-slate-500 mt-3 text-sm">Nenhum dado de ranking disponível</p>
            <p className="text-xs text-slate-400 mt-1">Vendas serão contabilizadas aqui</p>
          </MobileCard>
        ) : (
          <>
            {/* Pódio Top 3 */}
            {top3.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-gold">trophy</span>
                  <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Top 3 Vendedores
                  </h3>
                </div>
                <div className="flex items-end justify-center gap-3 pt-2">
                  {[top3[1], top3[0], top3[2]].map((item, i) => {
                    if (!item) return <div key={i} className="flex-1" />;
                    const heights = [20, 28, 16];
                    const medal = medalhaIcon(item.posicao);
                    return (
                      <div key={item.alunoId} className="flex-1 flex flex-col items-center group">
                        <MobileAvatar name={item.alunoNome} size={i === 1 ? "lg" : "md"} />
                        <p className="text-xs font-bold text-center mt-1.5 truncate max-w-full px-1 text-slate-800 dark:text-white">
                          {item.alunoNome.split(" ")[0]}
                        </p>
                        <p className="text-xs font-semibold text-gold-dark dark:text-gold">
                          {formatCurrency(item.totalArrecadado)}
                        </p>
                        <p className="text-[10px] text-slate-400">{item.totalVendas} vendas</p>
                        <div className={`w-full mt-2 rounded-t-xl ${medal.bg} flex items-center justify-center transition-all group-hover:scale-105`} 
                             style={{ height: `${heights[i]}vw`, maxHeight: `${heights[i] * 4}px`, minHeight: `${heights[i] * 2}px` }}>
                          <span className={`text-2xl font-black ${medal.color}`}>#{item.posicao}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista completa */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-lg">list_alt</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Classificação Geral</p>
                <MobileBadge variant="primary" className="text-[10px]">{ranking.length}</MobileBadge>
              </div>
              <div className="space-y-2">
                {resto.map((item: RankingItem) => {
                  const medal = medalhaIcon(item.posicao);
                  return (
                    <div key={item.alunoId} className="mobile-list-item group">
                      <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${medal.bg}`}>
                        <span className={`text-base font-black ${medal.color}`}>#{item.posicao}</span>
                      </div>
                      <MobileAvatar name={item.alunoNome} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {item.alunoNome}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-500">{item.totalVendas} vendas</p>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <p className="text-xs text-primary font-medium">
                            {formatCurrency(item.totalArrecadado)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-primary flex-shrink-0">
                        {formatCurrency(item.totalArrecadado)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumo */}
            {ranking.length > 0 && (
              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Total arrecadado com rifas</span>
                  <span className="text-sm font-bold text-gold-dark dark:text-gold">
                    {formatCurrency(ranking.reduce((sum, item) => sum + item.totalArrecadado, 0))}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}