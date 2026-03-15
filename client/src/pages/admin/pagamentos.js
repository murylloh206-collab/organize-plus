import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
export default function AdminPagamentos() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [usuarioId, setUsuarioId] = useState("");
    const [vencimento, setVencimento] = useState("");
    const [error, setError] = useState("");
    const { data: pagamentos = [] } = useQuery({ queryKey: ["pagamentos"], queryFn: () => apiRequest("GET", "/pagamentos") });
    const { data: alunos = [] } = useQuery({ queryKey: ["alunos"], queryFn: () => apiRequest("GET", "/alunos") });
    const criar = useMutation({
        mutationFn: (data) => apiRequest("POST", "/pagamentos", data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["pagamentos"] }); setShowForm(false); },
        onError: (e) => setError(e.message),
    });
    const atualizar = useMutation({
        mutationFn: ({ id, status }) => apiRequest("PATCH", `/pagamentos/${id}`, { status }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pagamentos"] }),
    });
    const fmt = (v) => parseFloat(String(v || "0")).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const statusBadge = (s) => {
        if (s === "pago")
            return _jsx("span", { className: "badge-success", children: "Pago" });
        if (s === "pendente")
            return _jsx("span", { className: "badge-warning", children: "Pendente" });
        return _jsx("span", { className: "badge-danger", children: "Atrasado" });
    };
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", children: [_jsx(Sidebar, { role: "admin" }), _jsxs("main", { className: "flex-1 flex flex-col overflow-y-auto ml-64", children: [_jsx(Header, { title: "Pagamentos" }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold", children: "Gest\u00E3o de Pagamentos" }), _jsxs("p", { className: "text-sm text-slate-500", children: [pagamentos.length, " registros"] })] }), _jsxs("button", { onClick: () => setShowForm(true), className: "btn-primary flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "add" }), " Lan\u00E7ar Pagamento"] })] }), showForm && (_jsxs("div", { className: "card p-6 space-y-4", children: [_jsx("h4", { className: "font-bold", children: "Novo Pagamento" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("select", { className: "input", value: usuarioId, onChange: e => setUsuarioId(e.target.value), children: [_jsx("option", { value: "", children: "Selecionar aluno..." }), alunos.map((a) => _jsx("option", { value: a.id, children: a.nome }, a.id))] }), _jsx("input", { className: "input", placeholder: "Descri\u00E7\u00E3o", value: descricao, onChange: e => setDescricao(e.target.value) }), _jsx("input", { className: "input", type: "number", placeholder: "Valor (R$)", value: valor, onChange: e => setValor(e.target.value) }), _jsx("input", { className: "input", type: "date", placeholder: "Vencimento", value: vencimento, onChange: e => setVencimento(e.target.value) })] }), error && _jsx("p", { className: "text-red-500 text-sm", children: error }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => criar.mutate({ descricao, valor: parseFloat(valor), usuarioId: parseInt(usuarioId), dataVencimento: vencimento }), disabled: criar.isPending, className: "btn-primary", children: criar.isPending ? "Salvando..." : "Salvar" }), _jsx("button", { onClick: () => setShowForm(false), className: "btn-secondary", children: "Cancelar" })] })] })), _jsx("div", { className: "card overflow-hidden", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-slate-50 dark:bg-slate-800/50", children: ["Aluno", "Descrição", "Valor", "Vencimento", "Status", "Ações"].map(h => (_jsx("th", { className: "px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: h }, h))) }) }), _jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [pagamentos.map((row) => (_jsxs("tr", { className: "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold", children: row.usuario?.nome?.charAt(0) }), _jsx("span", { className: "text-sm font-semibold", children: row.usuario?.nome })] }) }), _jsx("td", { className: "px-6 py-4 text-sm", children: row.pagamento?.descricao }), _jsx("td", { className: "px-6 py-4 text-sm font-semibold", children: fmt(row.pagamento?.valor) }), _jsx("td", { className: "px-6 py-4 text-xs text-slate-500", children: row.pagamento?.dataVencimento ? new Date(row.pagamento.dataVencimento).toLocaleDateString("pt-BR") : "—" }), _jsx("td", { className: "px-6 py-4", children: statusBadge(row.pagamento?.status) }), _jsx("td", { className: "px-6 py-4", children: row.pagamento?.status !== "pago" && (_jsx("button", { onClick: () => atualizar.mutate({ id: row.pagamento?.id, status: "pago" }), className: "text-xs font-bold text-primary hover:underline", children: "Marcar pago" })) })] }, row.pagamento?.id))), pagamentos.length === 0 && _jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-12 text-center text-slate-400", children: "Nenhum pagamento." }) })] })] }) })] })] })] }));
}
