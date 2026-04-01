import { useState } from "react";
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
  avatarUrl?: string;
  totalVendas: number;
  totalArrecadado: number;
  posicao: number;
}

type Aba = "rifas" | "pagamentos" | "devedores";

export default function AdminRanking() {
  const { auth } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("rifas");

  const { data: rankingRifas = [], isLoading: loadingRifas } = useQuery<RankingItem[]>({
    queryKey: ["ranking", "rifas", auth?.salaId],
    queryFn: () => apiRequest("GET", `/ranking/rifas?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const { data: rankingPagamentos = [], isLoading: loadingPags } = useQuery<RankingItem[]>({
    queryKey: ["ranking", "pagamentos", auth?.salaId],
    queryFn: () => apiRequest("GET", `/ranking/pagamentos?salaId=${auth?.salaId}`),
    enabled: !!auth?.salaId,
  });

  const isLoading = abaAtiva === "rifas" ? loadingRifas : abaAtiva === "pagamentos" ? loadingPags : false;
  const ranking: RankingItem[] = abaAtiva === "rifas" ? rankingRifas : abaAtiva === "pagamentos" ? rankingPagamentos : [];

  const medalhaIcon = (pos: number) => {
    if (pos === 1) return { color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40", label: "🥇" };
    if (pos === 2) return { color: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", label: "🥈" };
    if (pos === 3) return { color: "text-amber-700", bg: "bg-amber-50/70 dark:bg-amber-950/20", label: "🥉" };
    return { color: "text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50", label: `${pos}º` };
  };

  const top3 = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  const RankingContent = () => (
    <>
      {top3.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-500">trophy</span>
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Top 3
            </h3>
          </div>
          <div className="flex items-end justify-center gap-3 pt-2">
            {[top3[1], top3[0], top3[2]].map((item, i) => {
              if (!item) return <div key={i} className="flex-1" />;
              const heights = [20, 28, 16];
              const medal = medalhaIcon(item.posicao);
              return (
                <div key={item.alunoId} className="flex-1 flex flex-col items-center group">
                  <MobileAvatar name={item.alunoNome} src={item.avatarUrl ?? undefined} size={i === 1 ? "lg" : "md"} />
                  <p className="text-xs font-bold text-center mt-1.5 truncate max-w-full px-1 text-slate-800 dark:text-white">
                    {item.alunoNome.split(" ")[0]}
                  </p>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(item.totalArrecadado)}
                  </p>
                  <p className="text-[10px] text-slate-400">{item.totalVendas} itens</p>
                  <div className={`w-full mt-2 rounded-t-xl ${medal.bg} flex items-center justify-center`}
                       style={{ height: `${heights[i]}vw`, maxHeight: `${heights[i] * 4}px`, minHeight: `${heights[i] * 2}px` }}>
                    <span className={`text-2xl font-black ${medal.color}`}>{medal.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ranking.length === 0 && !isLoading && (
        <MobileCard className="text-center py-12">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">leaderboard</span>
          <p className="text-slate-500 mt-3 text-sm">Nenhum dado disponível</p>
          <p className="text-xs text-slate-400 mt-1">Os dados aparecerão aqui quando houver registros</p>
        </MobileCard>
      )}

      {resto.length > 0 && (
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
                    <span className={`text-base font-black ${medal.color}`}>{medal.label}</span>
                  </div>
                  <MobileAvatar name={item.alunoNome} src={item.avatarUrl ?? undefined} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                      {item.alunoNome}
                    </p>
                    <p className="text-xs text-slate-500">{item.totalVendas} itens · {formatCurrency(item.totalArrecadado)}</p>
                  </div>
                  <span className="text-sm font-black text-primary flex-shrink-0">
                    {formatCurrency(item.totalArrecadado)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <MobileLayout role="admin">
      <MobileHeader title="Ranking" subtitle="Classificação dos alunos" gradient />

      <div className="px-4 py-4 space-y-4">
        {/* Abas */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
          {(["rifas", "pagamentos", "devedores"] as Aba[]).map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                abaAtiva === aba
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {aba === "rifas" ? "Rifas" : aba === "pagamentos" ? "Pagamentos" : "Devedores"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : abaAtiva === "devedores" ? (
          <MobileCard className="text-center py-14 space-y-4">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin" style={{ animationDuration: "3s" }}>
              settings
            </span>
            <div>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">Em breve</p>
              <p className="text-xs text-slate-400 mt-1">O ranking de devedores estará disponível em breve.</p>
            </div>
          </MobileCard>
        ) : (
          <RankingContent />
        )}
      </div>
    </MobileLayout>
  );
}