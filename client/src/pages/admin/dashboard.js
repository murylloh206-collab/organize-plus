import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
            if (!auth?.salaId)
                return { totalArrecadado: 0, totalAlunos: 0, totalTickets: 0, saldoCaixa: 0 };
            return apiRequest("GET", `/dashboard/stats?salaId=${auth.salaId}`);
        },
        enabled: !!auth?.userId,
    });
    const { data: pagamentos, isLoading: pagamentosLoading } = useQuery({
        queryKey: ["pagamentos-recentes", auth?.salaId],
        queryFn: async () => {
            if (!auth?.salaId)
                return [];
            return apiRequest("GET", `/dashboard/recentes?salaId=${auth.salaId}&limite=5`);
        },
        enabled: !!auth?.userId,
    });
    const { data: metaData } = useQuery({
        queryKey: ["meta-formatura", auth?.salaId],
        queryFn: async () => {
            if (!auth?.salaId)
                return { metaTotal: 0, arrecadado: 0, percentual: 0 };
            return apiRequest("GET", `/dashboard/formatura?salaId=${auth.salaId}`);
        },
        enabled: !!auth?.userId,
    });
    const { data: receitaMensal } = useQuery({
        queryKey: ["receita-mensal", auth?.salaId],
        queryFn: async () => {
            if (!auth?.salaId)
                return { meses: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"], valores: [0, 0, 0, 0, 0, 0], mesAtual: 0 };
            return apiRequest("GET", `/dashboard/mensal?salaId=${auth.salaId}`);
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
    const meses = receitaMensal?.meses ?? ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    const valores = receitaMensal?.valores ?? [0, 0, 0, 0, 0, 0];
    const mesAtual = receitaMensal?.mesAtual ?? new Date().getMonth();
    const maxValor = Math.max(...valores, 1);
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsxs("div", { className: "mobile-header-gradient pb-6 px-5 pt-12", children: [_jsxs("div", { children: [_jsx("p", { className: "text-indigo-200 text-sm font-medium", children: "Ol\u00E1, Comiss\u00E3o " }), _jsx("h1", { className: "text-2xl font-black text-white tracking-tight mt-0.5", children: "Dashboard" })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Link, { to: "/admin/configuracoes", className: "p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-white text-xl", children: "settings" }) }) })] }), _jsxs("div", { className: "px-4 -mt-3 space-y-4 pb-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 animate-slide-in-bottom", children: [_jsx(MobileMetricCard, { title: "Arrecadado", value: statsLoading ? "..." : formatCurrency(totalArrecadado), icon: "account_balance_wallet", color: "primary", loading: statsLoading }), _jsx(MobileMetricCard, { title: "Alunos", value: statsLoading ? "..." : String(totalAlunos), icon: "school", color: "blue", loading: statsLoading }), _jsx(MobileMetricCard, { title: "Rifas Vendidas", value: statsLoading ? "..." : String(totalTickets), icon: "confirmation_number", color: "purple", loading: statsLoading }), _jsx(MobileMetricCard, { title: "Saldo Caixa", value: statsLoading ? "..." : formatCurrency(saldo), icon: "savings", color: "green", loading: statsLoading })] }), _jsxs(MobileCard, { className: "animate-slide-in-bottom delay-75", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-slate-900 dark:text-white text-sm", children: "Meta da Formatura" }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5", children: [formatCurrency(metaArrecadado), " de ", formatCurrency(metaTotal)] })] }), _jsx(ProgressCircle, { value: percentualMeta, size: 72, strokeWidth: 7, color: "#6366f1" })] }), _jsx("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5", children: _jsx("div", { className: "h-1.5 rounded-full gradient-primary transition-all duration-700", style: { width: `${Math.min(percentualMeta, 100)}%` } }) }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-2 text-right", children: ["Restante: ", formatCurrency(metaTotal - metaArrecadado)] })] }), _jsxs(MobileCard, { className: "animate-slide-in-bottom delay-150", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-slate-900 dark:text-white text-sm", children: "Receita Mensal" }), _jsx("p", { className: "text-xs text-slate-400", children: "Fluxo de caixa 2026" })] }), _jsx("span", { className: "badge-info text-xs", children: "2026" })] }), _jsx("div", { className: "flex items-end gap-1.5 h-28", children: meses.map((mes, i) => {
                                    const height = maxValor > 0 ? (valores[i] / maxValor) * 100 : 0;
                                    return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-1.5", children: [_jsx("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex items-end", style: { height: "88px" }, children: _jsx("div", { className: `w-full rounded-t-lg transition-all duration-500 ${i === mesAtual ? "gradient-primary" : "bg-indigo-200 dark:bg-indigo-900/40"}`, style: { height: `${Math.max(height, 4)}%` } }) }), _jsx("span", { className: `text-[9px] font-bold uppercase ${i === mesAtual ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`, children: mes })] }, mes));
                                }) })] }), _jsxs("div", { className: "animate-slide-in-bottom delay-150", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3", children: "A\u00E7\u00F5es R\u00E1pidas" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: [
                                    { icon: "person_add", label: "Aluno", to: "/admin/alunos", color: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" },
                                    { icon: "confirmation_number", label: "Rifa", to: "/admin/rifas", color: "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
                                    { icon: "payments", label: "Pag.", to: "/admin/pagamentos", color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
                                    { icon: "flag", label: "Meta", to: "/admin/metas", color: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
                                ].map((a) => (_jsxs(Link, { to: a.to, className: "flex flex-col items-center gap-1.5 group", children: [_jsx("div", { className: `size-12 rounded-2xl flex items-center justify-center ${a.color} group-active:scale-95 transition-transform`, children: _jsx("span", { className: "material-symbols-outlined text-xl", children: a.icon }) }), _jsx("span", { className: "text-[10px] font-semibold text-slate-600 dark:text-slate-400", children: a.label })] }, a.to))) })] }), _jsxs("div", { className: "animate-slide-in-bottom delay-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide", children: "Pagamentos Recentes" }), _jsx(Link, { to: "/admin/pagamentos", className: "text-xs text-indigo-600 dark:text-indigo-400 font-semibold", children: "Ver todos" })] }), pagamentosLoading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => (_jsxs("div", { className: "mobile-card p-3 flex items-center gap-3", children: [_jsx("div", { className: "skeleton size-9 rounded-full" }), _jsxs("div", { className: "flex-1 space-y-1.5", children: [_jsx("div", { className: "skeleton h-3.5 w-28" }), _jsx("div", { className: "skeleton h-3 w-20" })] }), _jsx("div", { className: "skeleton h-5 w-14 rounded-full" })] }, i))) })) : pagamentos && pagamentos.length > 0 ? (_jsx("div", { className: "space-y-2", children: pagamentos.map((row, idx) => (_jsxs("div", { className: "mobile-list-item", children: [_jsx(MobileAvatar, { name: row.alunoNome || "A", size: "sm" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white truncate", children: row.alunoNome || "Aluno" }), _jsx("p", { className: "text-xs text-slate-500", children: formatDate(row.data) })] }), _jsxs("div", { className: "flex flex-col items-end gap-1", children: [_jsx("span", { className: "text-sm font-bold text-slate-900 dark:text-white", children: formatCurrency(parseFloat(row.valor || "0")) }), _jsx(MobileBadge, { variant: row.status === "pago" || row.status === "completed" ? "success" : row.status === "pendente" || row.status === "pending" ? "warning" : "danger" })] })] }, row.id || idx))) })) : (_jsxs(MobileCard, { className: "text-center py-8", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl", children: "receipt_long" }), _jsx("p", { className: "text-sm text-slate-400 mt-2", children: "Nenhum pagamento registrado" })] }))] })] })] }));
}
