import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileCard from "../../components/ui/MobileCard";
import ProgressCircle from "../../components/ui/ProgressCircle";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
export default function AlunoDashboard() {
    const { auth } = useAuth();
    const [hideValues, setHideValues] = useState(false);
    // Consultas
    const { data: me, isLoading: meLoading } = useQuery({
        queryKey: ["me"],
        queryFn: () => apiRequest("GET", "/alunos/me"),
        enabled: !!auth,
    });
    const { data: pagamentos = [], isLoading: pagLoading } = useQuery({
        queryKey: ["meus-pagamentos"],
        queryFn: () => apiRequest("GET", "/pagamentos/meus"),
        enabled: !!auth,
    });
    const { data: tickets = [], isLoading: ticLoading } = useQuery({
        queryKey: ["meus-tickets"],
        queryFn: () => apiRequest("GET", "/rifas/meus-tickets"),
        enabled: !!auth,
    });
    const { data: saldoCaixa } = useQuery({
        queryKey: ["caixa-saldo"],
        queryFn: () => apiRequest("GET", "/caixa/saldo"),
        enabled: !!auth,
    });
    const { data: metas = [] } = useQuery({
        queryKey: ["metas"],
        queryFn: () => apiRequest("GET", "/metas"),
        enabled: !!auth,
    });
    const isLoading = meLoading || pagLoading || ticLoading;
    // Progresso do aluno
    const pago = pagamentos.filter((p) => p.status === "pago").reduce((s, p) => s + parseFloat(p.valor || 0), 0);
    const total = pagamentos.reduce((s, p) => s + parseFloat(p.valor || 0), 0);
    const pct = total > 0 ? (pago / total) * 100 : 0;
    const faltam = total - pago;
    // Meta da turma
    const meta = metas[0];
    const metaAtual = parseFloat(meta?.valorAtual || "0");
    const metaTotal = parseFloat(meta?.valorMeta || "1");
    const metaPct = Math.min((metaAtual / metaTotal) * 100, 100);
    const formatValue = (value) => hideValues ? "••••••" : formatCurrency(value);
    return (_jsxs(MobileLayout, { role: "aluno", children: [_jsx("div", { className: "gradient-primary rounded-b-[2rem] px-6 pt-12 pb-24 shadow-lg relative z-0", children: _jsxs("div", { className: "flex justify-between items-center text-white", children: [_jsxs("div", { children: [_jsx("p", { className: "text-indigo-100 text-sm font-medium", children: "Bem-vindo(a) de volta," }), _jsx("h1", { className: "text-2xl font-black mt-1", children: isLoading ? _jsx("span", { className: "animate-pulse bg-white/20 h-8 w-32 rounded inline-block" }) : me?.nome?.split(" ")[0] || "Aluno" })] }), _jsxs("button", { className: "size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-sm shadow-sm relative", children: [_jsx("span", { className: "material-symbols-outlined font-light text-[22px]", children: "notifications" }), _jsx("span", { className: "absolute top-2 right-2 size-2.5 bg-rose-500 rounded-full border-2 border-indigo-600" })] })] }) }), _jsxs("div", { className: "px-4 -mt-16 space-y-4 relative z-10 pb-4", children: [_jsxs(MobileCard, { className: "p-6 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" }), _jsx("h3", { className: "font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase text-[10px] tracking-widest text-center", children: "Seu Pagamento" }), _jsxs("div", { className: "flex flex-col items-center justify-center", children: [_jsx(ProgressCircle, { value: pct, size: 150, strokeWidth: 12 }), _jsxs("p", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center", children: ["Faltam ", _jsx("span", { className: "text-primary font-black text-sm", children: formatValue(faltam) }), " para a quita\u00E7\u00E3o"] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(MobileCard, { className: "p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("span", { className: "material-symbols-outlined text-indigo-600 dark:text-indigo-400", children: "account_balance" }), _jsx("button", { onClick: () => setHideValues(!hideValues), className: "text-indigo-400", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: hideValues ? "visibility_off" : "visibility" }) })] }), _jsx("p", { className: "text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1", children: "Caixa da Turma" }), _jsx("p", { className: "text-xl font-black text-slate-900 dark:text-white", children: formatValue(saldoCaixa?.saldo ?? 0) }), _jsxs(Link, { to: "/aluno/caixa", className: "text-[10px] text-indigo-600 font-bold mt-2 flex items-center hover:underline", children: ["Ver detalhes ", _jsx("span", { className: "material-symbols-outlined text-[10px] ml-0.5", children: "arrow_forward" })] })] }), _jsxs(MobileCard, { className: "p-4 flex flex-col justify-between", children: [_jsx("div", { className: "flex justify-between items-start mb-2", children: _jsx("span", { className: "material-symbols-outlined text-emerald-600 dark:text-emerald-400", children: "receipt_long" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1", children: "Meus Boletos" }), _jsx(Link, { to: "/aluno/pagamentos", className: "text-sm font-black text-slate-900 dark:text-white hover:text-primary transition-colors", children: "Realizar Pagamento" })] })] })] }), _jsxs(MobileCard, { children: [_jsxs("div", { className: "flex justify-between items-end mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-slate-900 dark:text-white", children: "Meta da Turma" }), _jsx("p", { className: "text-[10px] font-semibold text-slate-400 uppercase tracking-wider", children: meta?.titulo || "Arrecadação Geral" })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-base font-black text-primary", children: formatValue(metaAtual) }), _jsxs("span", { className: "text-[10px] font-bold text-slate-400 block", children: ["de ", formatValue(metaTotal)] })] })] }), _jsx("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden", children: _jsx("div", { className: "gradient-primary h-full rounded-full transition-all duration-1000", style: { width: `${metaPct}%` } }) }), _jsxs("p", { className: "text-[10px] font-bold text-slate-500 mt-2 text-right", children: [Math.round(metaPct), "% alcan\u00E7ado"] })] }), _jsxs(MobileCard, { className: "p-0 overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [_jsx("h3", { className: "text-sm font-bold text-slate-900 dark:text-white", children: "\u00DAltimas Faturas" }), _jsx(Link, { to: "/aluno/pagamentos", className: "text-[10px] text-primary font-bold uppercase tracking-widest hover:underline", children: "Ver Todas" })] }), _jsxs("div", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [pagamentos.slice(0, 3).map((p) => (_jsxs("div", { className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `size-10 rounded-full flex items-center justify-center shrink-0 ${p.status === "pago" ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"}`, children: _jsx("span", { className: "material-symbols-outlined text-sm", children: p.status === "pago" ? "check" : "schedule" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold text-slate-900 dark:text-white", children: p.descricao }), _jsx("p", { className: "text-xs text-slate-500", children: p.status === "pago" ? "Pago" : "Pendente" })] })] }), _jsx("p", { className: "text-sm font-black text-slate-900 dark:text-white", children: formatValue(p.valor) })] }, p.id))), pagamentos.length === 0 && (_jsx("div", { className: "p-6 text-center text-slate-400 text-xs", children: "Nenhuma fatura encontrada." }))] })] }), tickets.length > 0 && (_jsxs(MobileCard, { className: "p-0 overflow-hidden mb-4", children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/20", children: [_jsx("h3", { className: "text-sm font-bold text-indigo-900 dark:text-indigo-100", children: "Suas Vendas (Rifas)" }), _jsx(Link, { to: "/aluno/rifas", className: "text-[10px] text-indigo-600 font-bold uppercase tracking-widest hover:underline", children: "Gerenciar" })] }), _jsx("div", { className: "p-4 space-y-3", children: tickets.slice(0, 2).map((t) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm font-bold text-slate-900 dark:text-white", children: ["Rifa #", String(t.numero).padStart(3, '0')] }), _jsx("p", { className: "text-[10px] text-slate-500 uppercase tracking-widest", children: t.compradorNome })] }), _jsx("span", { className: `text-[10px] font-bold px-2 py-0.5 rounded uppercase ${t.status === "pago" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`, children: t.status })] }, t.id))) })] }))] })] }));
}
