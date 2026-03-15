import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
export default function AdminRelatorios() {
    const { data: pagamentos = [] } = useQuery({ queryKey: ["pagamentos"], queryFn: () => apiRequest("GET", "/pagamentos") });
    const { data: rifas = [] } = useQuery({ queryKey: ["rifas"], queryFn: () => apiRequest("GET", "/rifas") });
    const { data: alunos = [] } = useQuery({ queryKey: ["alunos"], queryFn: () => apiRequest("GET", "/alunos") });
    const { data: caixa } = useQuery({ queryKey: ["caixa-saldo"], queryFn: () => apiRequest("GET", "/caixa/saldo") });
    const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const totalPago = pagamentos.filter((p) => p.pagamento?.status === "pago").reduce((s, p) => s + parseFloat(p.pagamento?.valor || 0), 0);
    const totalPendente = pagamentos.filter((p) => p.pagamento?.status !== "pago").reduce((s, p) => s + parseFloat(p.pagamento?.valor || 0), 0);
    const taxaAdimplencia = pagamentos.length > 0 ? (pagamentos.filter((p) => p.pagamento?.status === "pago").length / pagamentos.length * 100).toFixed(1) : "0";
    const stats = [
        { label: "Total Arrecadado", value: fmt(totalPago), icon: "attach_money", color: "text-emerald-500" },
        { label: "A Receber", value: fmt(totalPendente), icon: "pending", color: "text-amber-500" },
        { label: "Saldo Caixa", value: fmt(caixa?.saldo ?? 0), icon: "savings", color: "text-primary" },
        { label: "Taxa Adimplência", value: `${taxaAdimplencia}%`, icon: "percent", color: "text-violet-500" },
        { label: "Total Alunos", value: String(alunos.length), icon: "group", color: "text-slate-500" },
        { label: "Rifas Ativas", value: String(rifas.filter((r) => r.status === "ativa").length), icon: "confirmation_number", color: "text-sky-500" },
    ];
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", children: [_jsx(Sidebar, { role: "admin" }), _jsxs("main", { className: "flex-1 flex flex-col overflow-y-auto ml-64", children: [_jsx(Header, { title: "Relat\u00F3rios" }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold", children: "Relat\u00F3rios Avan\u00E7ados" }), _jsx("p", { className: "text-sm text-slate-500", children: "Vis\u00E3o geral das finan\u00E7as da turma" })] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-4", children: stats.map(s => (_jsxs("div", { className: "card p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("span", { className: `material-symbols-outlined text-2xl ${s.color}`, children: s.icon }), _jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-slate-400", children: s.label })] }), _jsx("p", { className: "text-2xl font-black", children: s.value })] }, s.label))) }), _jsxs("div", { className: "card p-6", children: [_jsx("h4", { className: "font-bold mb-4", children: "Distribui\u00E7\u00E3o de Pagamentos" }), _jsx("div", { className: "space-y-3", children: [
                                            { label: "Pagos", count: pagamentos.filter((p) => p.pagamento?.status === "pago").length, color: "bg-emerald-500" },
                                            { label: "Pendentes", count: pagamentos.filter((p) => p.pagamento?.status === "pendente").length, color: "bg-amber-500" },
                                            { label: "Atrasados", count: pagamentos.filter((p) => p.pagamento?.status === "atrasado").length, color: "bg-red-500" },
                                        ].map(item => (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "font-semibold", children: item.label }), _jsxs("span", { className: "text-slate-500", children: [item.count, " pagamentos"] })] }), _jsx("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2", children: _jsx("div", { className: `${item.color} h-full rounded-full transition-all`, style: { width: pagamentos.length > 0 ? `${(item.count / pagamentos.length) * 100}%` : "0%" } }) })] }, item.label))) })] })] })] })] }));
}
