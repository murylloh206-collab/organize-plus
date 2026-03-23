import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs(MobileLayout, { role: "aluno", children: [_jsx(MobileHeader, { title: "Caixa Transparente", subtitle: "Movimenta\u00E7\u00F5es da Turma", gradient: true }), _jsxs("div", { className: "px-4 py-4 space-y-4", children: [_jsxs(MobileCard, { variant: "gradient", className: "text-center py-8", children: [_jsxs("div", { className: "flex items-center justify-center gap-2 mb-2 text-white/80", children: [_jsx("span", { className: "material-symbols-outlined", children: "account_balance" }), _jsx("p", { className: "text-xs font-bold uppercase tracking-widest", children: "Saldo Atual" })] }), isLoading ? (_jsx("div", { className: "h-12 w-48 bg-white/20 rounded-xl animate-pulse mx-auto" })) : (_jsx("p", { className: "text-4xl font-black text-white", children: formatCurrency(saldoData?.saldo ?? 0) })), _jsx("p", { className: "text-[10px] text-white/60 mt-3 font-medium bg-white/10 inline-block px-3 py-1 rounded-full", children: "Transpar\u00EAncia em tempo real" })] }), _jsxs(MobileCard, { className: "p-0 overflow-hidden", children: [_jsx("div", { className: "px-5 py-4 border-b border-slate-100 dark:border-slate-800", children: _jsx("h4", { className: "font-bold text-sm text-slate-900 dark:text-white", children: "Extrato de Movimenta\u00E7\u00F5es" }) }), isLoading ? (_jsx("div", { className: "p-5 space-y-4", children: [1, 2, 3].map((i) => _jsx(Skeleton, { variant: "card" }, i)) })) : movimentos.length === 0 ? (_jsxs("div", { className: "px-6 py-12 text-center", children: [_jsx("span", { className: "material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2", children: "receipt_long" }), _jsx("p", { className: "text-sm text-slate-500", children: "Nenhuma movimenta\u00E7\u00E3o registrada." })] })) : (_jsx("div", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: movimentos.map((row, i) => {
                                    const isEntrada = row.mov?.tipo === "entrada";
                                    return (_jsxs("div", { className: "px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `size-10 rounded-xl flex items-center justify-center shrink-0 ${isEntrada ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"}`, children: _jsx("span", { className: "material-symbols-outlined text-sm", children: isEntrada ? "arrow_downward" : "arrow_upward" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-sm text-slate-900 dark:text-white truncate max-w-[160px]", children: row.mov?.descricao }), _jsxs("p", { className: "text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest", children: [row.usuario?.nome && `${row.usuario.nome.split(" ")[0]} • `, row.mov?.data ? formatDate(row.mov.data) : ""] })] })] }), _jsxs("p", { className: `font-black text-sm shrink-0 ${isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`, children: [isEntrada ? "+" : "-", formatCurrency(row.mov?.valor)] })] }, row.mov?.id ?? i));
                                }) }))] })] })] }));
}
