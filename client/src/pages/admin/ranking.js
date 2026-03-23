import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
export default function AdminRanking() {
    const { auth } = useAuth();
    const { data: ranking = [], isLoading } = useQuery({
        queryKey: ["ranking", auth?.salaId],
        queryFn: () => apiRequest("GET", `/ranking?salaId=${auth?.salaId}`),
        enabled: !!auth?.salaId,
    });
    const medalhaIcon = (pos) => {
        if (pos === 1)
            return {
                icon: "emoji_events",
                color: "text-amber-500",
                bg: "bg-amber-50 dark:bg-amber-950/40",
                label: "🥇 Ouro"
            };
        if (pos === 2)
            return {
                icon: "emoji_events",
                color: "text-slate-400",
                bg: "bg-slate-100 dark:bg-slate-800",
                label: "🥈 Prata"
            };
        if (pos === 3)
            return {
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
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: "Ranking", subtitle: "Melhores vendedores do m\u00EAs", gradient: true }), _jsx("div", { className: "px-4 py-4 space-y-4", children: isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => _jsx(Skeleton, { variant: "card" }, i)) })) : ranking.length === 0 ? (_jsxs(MobileCard, { className: "text-center py-12", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl", children: "leaderboard" }), _jsx("p", { className: "text-slate-500 mt-3 text-sm", children: "Nenhum dado de ranking dispon\u00EDvel" }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Vendas ser\u00E3o contabilizadas aqui" })] })) : (_jsxs(_Fragment, { children: [top3.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-center gap-2 mb-4", children: [_jsx("span", { className: "material-symbols-outlined text-gold", children: "trophy" }), _jsx("h3", { className: "text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide", children: "Top 3 Vendedores" })] }), _jsx("div", { className: "flex items-end justify-center gap-3 pt-2", children: [top3[1], top3[0], top3[2]].map((item, i) => {
                                        if (!item)
                                            return _jsx("div", { className: "flex-1" }, i);
                                        const heights = [20, 28, 16];
                                        const medal = medalhaIcon(item.posicao);
                                        return (_jsxs("div", { className: "flex-1 flex flex-col items-center group", children: [_jsx(MobileAvatar, { name: item.alunoNome, size: i === 1 ? "lg" : "md" }), _jsx("p", { className: "text-xs font-bold text-center mt-1.5 truncate max-w-full px-1 text-slate-800 dark:text-white", children: item.alunoNome.split(" ")[0] }), _jsx("p", { className: "text-xs font-semibold text-gold-dark dark:text-gold", children: formatCurrency(item.totalArrecadado) }), _jsxs("p", { className: "text-[10px] text-slate-400", children: [item.totalVendas, " vendas"] }), _jsx("div", { className: `w-full mt-2 rounded-t-xl ${medal.bg} flex items-center justify-center transition-all group-hover:scale-105`, style: { height: `${heights[i]}vw`, maxHeight: `${heights[i] * 4}px`, minHeight: `${heights[i] * 2}px` }, children: _jsxs("span", { className: `text-2xl font-black ${medal.color}`, children: ["#", item.posicao] }) })] }, item.alunoId));
                                    }) })] })), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "material-symbols-outlined text-primary text-lg", children: "list_alt" }), _jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wide", children: "Classifica\u00E7\u00E3o Geral" }), _jsx(MobileBadge, { variant: "primary", className: "text-[10px]", children: ranking.length })] }), _jsx("div", { className: "space-y-2", children: resto.map((item) => {
                                        const medal = medalhaIcon(item.posicao);
                                        return (_jsxs("div", { className: "mobile-list-item group", children: [_jsx("div", { className: `size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${medal.bg}`, children: _jsxs("span", { className: `text-base font-black ${medal.color}`, children: ["#", item.posicao] }) }), _jsx(MobileAvatar, { name: item.alunoNome, size: "sm" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors", children: item.alunoNome }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("p", { className: "text-xs text-slate-500", children: [item.totalVendas, " vendas"] }), _jsx("span", { className: "w-1 h-1 rounded-full bg-slate-300" }), _jsx("p", { className: "text-xs text-primary font-medium", children: formatCurrency(item.totalArrecadado) })] })] }), _jsx("span", { className: "text-sm font-black text-primary flex-shrink-0", children: formatCurrency(item.totalArrecadado) })] }, item.alunoId));
                                    }) })] }), ranking.length > 0 && (_jsx("div", { className: "mt-4 pt-2 border-t border-slate-100 dark:border-slate-800", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-xs text-slate-500", children: "Total arrecadado com rifas" }), _jsx("span", { className: "text-sm font-bold text-gold-dark dark:text-gold", children: formatCurrency(ranking.reduce((sum, item) => sum + item.totalArrecadado, 0)) })] }) }))] })) })] }));
}
