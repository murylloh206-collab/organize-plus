import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
function StatCard({ label, value, icon, trend }) {
    return (_jsxs("div", { className: "card p-6 relative overflow-hidden group transition-all hover:shadow-lg border-l-4 border-[#c6a43f]", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest", children: label }), _jsx("h3", { className: "text-3xl font-black mt-2 text-[#1e3a5f] dark:text-white", children: value })] }), _jsx("div", { className: "p-3 bg-[#c6a43f]/10 text-[#c6a43f] rounded-xl transition-all group-hover:bg-[#c6a43f] group-hover:text-white shadow-sm", children: _jsx("span", { className: "material-symbols-outlined text-2xl", children: icon }) })] }), trend && (_jsxs("div", { className: "mt-4 flex items-center gap-2", children: [_jsxs("span", { className: "px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-xs", children: "trending_up" }), trend] }), _jsx("span", { className: "text-[10px] text-slate-400 font-bold uppercase", children: "vs m\u00EAs passado" })] }))] }));
}
export default function AdminDashboard() {
    const { auth } = useAuth();
    const { data: stats } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: () => apiRequest("GET", "/alunos/dashboard-stats"),
        enabled: !!auth?.salaId,
    });
    const { data: pagamentos } = useQuery({
        queryKey: ["pagamentos"],
        queryFn: () => apiRequest("GET", "/pagamentos"),
        enabled: !!auth?.salaId,
    });
    const totalArrecadado = stats?.totalArrecadado ?? 0;
    const totalAlunos = stats?.totalAlunos ?? 0;
    const totalTickets = stats?.totalTickets ?? 0;
    const saldo = stats?.saldoCaixa ?? 0;
    const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const statusBadge = (status) => {
        if (status === "pago")
            return _jsx("span", { className: "badge-success", children: "Pago" });
        if (status === "pendente")
            return _jsx("span", { className: "badge-warning", children: "Pendente" });
        return _jsx("span", { className: "badge-danger", children: "Atrasado" });
    };
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", children: [_jsx(Sidebar, { role: "admin" }), _jsxs("main", { className: "flex-1 flex flex-col overflow-y-auto ml-64", children: [_jsx(Header, { title: "Dashboard" }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(StatCard, { label: "Total Arrecadado", value: fmt(totalArrecadado), icon: "account_balance_wallet", trend: "+12.5%" }), _jsx(StatCard, { label: "Alunos Ativos", value: String(totalAlunos), icon: "school", trend: "+3.2%" }), _jsx(StatCard, { label: "Rifas Vendidas", value: String(totalTickets), icon: "confirmation_number", trend: "+15.8%" }), _jsx(StatCard, { label: "Saldo Caixa", value: fmt(saldo), icon: "savings" })] }), _jsxs("div", { className: "card overflow-hidden", children: [_jsxs("div", { className: "px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-bold", children: "Pagamentos Recentes" }), _jsx("p", { className: "text-xs text-slate-400 font-medium mt-0.5", children: "Hist\u00F3rico de transa\u00E7\u00F5es em tempo real" })] }), _jsx("a", { href: "/admin/pagamentos", className: "text-primary text-xs font-bold uppercase tracking-wide hover:underline", children: "Ver todos" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-slate-50 dark:bg-slate-800/50", children: ["Aluno", "Descrição", "Valor", "Data", "Status", ""].map(h => (_jsx("th", { className: "px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: h }, h))) }) }), _jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [(pagamentos || []).slice(0, 8).map((row, idx) => (_jsxs("tr", { className: `${idx % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50/50 dark:bg-slate-800/30'} hover:bg-[#c6a43f]/5 transition-colors group`, children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-9 rounded-full bg-[#1e3a5f] text-[#c6a43f] flex items-center justify-center font-black text-xs shrink-0 shadow-sm", children: row.usuario?.nome?.charAt(0) || "?" }), _jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: row.usuario?.nome })] }) }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-500 font-medium", children: row.pagamento?.descricao }), _jsx("td", { className: "px-6 py-4 text-sm font-black text-[#1e3a5f] dark:text-white", children: fmt(parseFloat(row.pagamento?.valor || "0")) }), _jsx("td", { className: "px-6 py-4 text-xs text-slate-400 font-bold uppercase", children: row.pagamento?.dataPagamento ? new Date(row.pagamento.dataPagamento).toLocaleDateString("pt-BR") : "—" }), _jsx("td", { className: "px-6 py-4", children: statusBadge(row.pagamento?.status) }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsx("button", { className: "p-2 rounded-lg text-slate-300 hover:text-[#c6a43f] hover:bg-[#c6a43f]/10 transition-all opacity-0 group-hover:opacity-100", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "arrow_forward" }) }) })] }, row.pagamento?.id))), (!pagamentos || pagamentos.length === 0) && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-12 text-center text-slate-400 text-sm", children: "Nenhum pagamento registrado ainda." }) }))] })] }) })] })] })] })] }));
}
