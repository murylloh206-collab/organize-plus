import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const pagamentosFlat = pagamentos.map((item) => item.pagamento ?? item);
    const pagos = pagamentosFlat.filter((p) => p.status === "pago");
    const pendentes = pagamentosFlat.filter((p) => p.status === "pendente");
    const hoje = new Date();
    const atrasados = pagamentosFlat.filter((p) => p.status !== "pago" && p.dataVencimento && new Date(p.dataVencimento) < hoje);
    const totalArrecadado = pagos.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
    const totalPendente = pendentes.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
    const totalAtrasado = atrasados.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: "Relat\u00F3rios", subtitle: "Vis\u00E3o geral financeira", gradient: true }), _jsx("div", { className: "px-4 py-4 space-y-4", children: isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => _jsx(Skeleton, { variant: "metric" }, i)) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileMetricCard, { title: "Total Arrecadado", value: formatCurrency(totalArrecadado), icon: "account_balance_wallet", color: "green", subtitle: `${pagos.length} pagtos` }), _jsx(MobileMetricCard, { title: "Pendente", value: formatCurrency(totalPendente), icon: "pending_actions", color: "amber", subtitle: `${pendentes.length} faturas` }), _jsx(MobileMetricCard, { title: "Atrasado", value: formatCurrency(totalAtrasado), icon: "warning", color: "rose", subtitle: `${atrasados.length} faturas` }), _jsx(MobileMetricCard, { title: "Alunos", value: String(alunos.length), icon: "school", color: "primary" })] }), _jsxs(MobileCard, { children: [_jsx("h3", { className: "text-sm font-bold text-slate-900 dark:text-white mb-3", children: "Taxa de Adimpl\u00EAncia" }), (() => {
                                    const total = pagamentosFlat.length;
                                    const taxa = total > 0 ? (pagos.length / total) * 100 : 0;
                                    const taxaPendente = total > 0 ? (pendentes.length / total) * 100 : 0;
                                    const taxaAtrasada = total > 0 ? (atrasados.length / total) * 100 : 0;
                                    return (_jsx("div", { className: "space-y-3", children: [
                                            { label: "Pagos", value: taxa, color: "bg-emerald-500", count: pagos.length },
                                            { label: "Pendentes", value: taxaPendente, color: "bg-amber-400", count: pendentes.length },
                                            { label: "Atrasados", value: taxaAtrasada, color: "bg-red-500", count: atrasados.length },
                                        ].map((item) => (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1", children: [_jsxs("span", { children: [item.label, " (", item.count, ")"] }), _jsxs("span", { className: "font-bold", children: [item.value.toFixed(1), "%"] })] }), _jsx("div", { className: "h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${item.color} transition-all duration-500`, style: { width: `${item.value}%` } }) })] }, item.label))) }));
                                })()] }), _jsxs(MobileCard, { children: [_jsx("h3", { className: "text-sm font-bold text-slate-900 dark:text-white mb-3", children: "\u00DAltimas Transa\u00E7\u00F5es" }), pagamentosFlat.length > 0 ? (_jsx("div", { className: "space-y-2", children: [...pagamentosFlat]
                                        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                                        .slice(0, 5)
                                        .map((p) => {
                                        const aluno = alunos.find((a) => a.id === p.usuarioId);
                                        return (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: aluno?.nome || "Aluno" }), _jsxs("p", { className: "text-xs text-slate-500", children: [p.descricao, " \u2022 ", formatDate(p.dataVencimento)] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm font-bold text-slate-900 dark:text-white", children: formatCurrency(parseFloat(p.valor) || 0) }), _jsx("span", { className: `text-xs font-semibold ${p.status === "pago" ? "text-emerald-600" : p.status === "pendente" ? "text-amber-600" : "text-red-500"}`, children: p.status })] })] }, p.id));
                                    }) })) : (_jsx("p", { className: "text-sm text-slate-400 text-center py-4", children: "Nenhuma transa\u00E7\u00E3o" }))] })] })) })] }));
}
