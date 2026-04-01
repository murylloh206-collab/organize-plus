import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import Skeleton from "../../components/ui/Skeleton";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";

interface RankingItem {
  alunoId: number;
  alunoNome: string;
  avatarUrl: string | null;
  totalArrecadado: number;
  totalVendas: number;
  posicao: number;
}

type TabType = "combinado" | "rifas" | "pagamentos";

function getInitials(nome: string): string {
  const parts = nome.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getMedalEmoji(posicao: number): string {
  if (posicao === 1) return "1";
  if (posicao === 2) return "2";
  if (posicao === 3) return "3";
  return `${posicao}`;
}

function getMedalStyle(posicao: number): string {
  if (posicao === 1) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-2 ring-amber-300";
  if (posicao === 2) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ring-2 ring-slate-300";
  if (posicao === 3) return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 ring-2 ring-orange-300";
  return "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
}

const tabs: { key: TabType; label: string; icon: string; endpoint: string }[] = [
  { key: "combinado", label: "Geral", icon: "trophy", endpoint: "/ranking" },
  { key: "rifas", label: "Rifas", icon: "confirmation_number", endpoint: "/ranking/rifas" },
  { key: "pagamentos", label: "Pagamentos", icon: "payments", endpoint: "/ranking/pagamentos" },
];

export default function AlunoRanking() {
  const { auth } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("combinado");

  const activeTabInfo = tabs.find((t) => t.key === activeTab)!;

  const { data: ranking = [], isLoading } = useQuery<RankingItem[]>({
    queryKey: ["ranking", activeTab],
    queryFn: () => apiRequest("GET", activeTabInfo.endpoint),
    enabled: !!auth,
  });

  // Encontrar posição do aluno logado
  const minhaPosicao = ranking.find((r) => r.alunoId === auth?.userId);

  return (
    <MobileLayout role="aluno">
      <MobileHeader title="Ranking" subtitle="Competição saudável" gradient showAvatar />

      <div className="px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Minha posição */}
        {minhaPosicao && (
          <MobileCard className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-12 rounded-full flex items-center justify-center font-black text-lg ${getMedalStyle(minhaPosicao.posicao)}`}>
                  {getMedalEmoji(minhaPosicao.posicao)}
                </div>
                <div>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Sua Posição</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{minhaPosicao.alunoNome}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(minhaPosicao.totalArrecadado)}
                </p>
                <p className="text-[10px] text-slate-500">{minhaPosicao.totalVendas} vendas</p>
              </div>
            </div>
          </MobileCard>
        )}

        {/* Lista do ranking */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">
            Classificação
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <MobileCard className="text-center py-8 bg-slate-50 dark:bg-slate-800/50">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">
                leaderboard
              </span>
              <p className="text-sm text-slate-500">Nenhum dado de ranking ainda.</p>
            </MobileCard>
          ) : (
            <div className="space-y-2">
              {ranking.map((item) => {
                const isMe = item.alunoId === auth?.userId;
                return (
                  <MobileCard
                    key={item.alunoId}
                    className={`p-3 ${isMe ? "ring-2 ring-indigo-300 dark:ring-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Posição */}
                      <div className={`size-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${getMedalStyle(item.posicao)}`}>
                        {getMedalEmoji(item.posicao)}
                      </div>

                      {/* Avatar e Nome */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt={item.alunoNome} className="size-7 rounded-full object-cover" />
                          ) : (
                            <div className="size-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                              {getInitials(item.alunoNome)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.alunoNome}
                              {isMe && <span className="text-indigo-500 ml-1 text-[10px]">(você)</span>}
                            </p>
                            <p className="text-[10px] text-slate-500">{item.totalVendas} vendas</p>
                          </div>
                        </div>
                      </div>

                      {/* Valor */}
                      <p className="text-sm font-black text-slate-900 dark:text-white shrink-0">
                        {formatCurrency(item.totalArrecadado)}
                      </p>
                    </div>
                  </MobileCard>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </MobileLayout>
  );
}
