import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
export default function AdminRifas() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [nome, setNome] = useState("");
    const [premio, setPremio] = useState("");
    const [preco, setPreco] = useState("");
    const [error, setError] = useState("");
    const [sorteando, setSorteando] = useState(null);
    const { data: rifas = [] } = useQuery({ queryKey: ["rifas"], queryFn: () => apiRequest("GET", "/rifas") });
    const criar = useMutation({
        mutationFn: (data) => apiRequest("POST", "/rifas", data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["rifas"] }); setShowForm(false); setNome(""); setPremio(""); setPreco(""); },
        onError: (e) => setError(e.message),
    });
    const sortear = useMutation({
        mutationFn: (id) => apiRequest("POST", `/rifas/${id}/sortear`, {}),
        onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["rifas"] }); setSorteando(null); alert(`🎉 Vencedor sorteado! Ticket #${data.vencedor?.id}`); },
        onError: (e) => { setSorteando(null); alert(e.message); },
    });
    const statusBadge = (s) => {
        if (s === "ativa")
            return _jsx("span", { className: "badge-success", children: "Ativa" });
        if (s === "encerrada")
            return _jsx("span", { className: "badge-warning", children: "Encerrada" });
        return _jsx("span", { className: "badge-danger", children: "Sorteada" });
    };
    const fmt = (v) => parseFloat(String(v)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", children: [_jsx(Sidebar, { role: "admin" }), _jsxs("main", { className: "flex-1 flex flex-col overflow-y-auto ml-64", children: [_jsx(Header, { title: "Rifas" }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold", children: "Gerenciar Rifas" }), _jsxs("p", { className: "text-sm text-slate-500", children: [rifas.length, " rifas criadas"] })] }), _jsxs("button", { onClick: () => setShowForm(true), className: "btn-primary flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "add" }), " Nova Rifa"] })] }), showForm && (_jsxs("div", { className: "card p-6 space-y-4", children: [_jsx("h4", { className: "font-bold", children: "Criar Rifa" }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx("input", { className: "input", placeholder: "Nome da rifa", value: nome, onChange: e => setNome(e.target.value) }), _jsx("input", { className: "input", placeholder: "Pr\u00EAmio", value: premio, onChange: e => setPremio(e.target.value) }), _jsx("input", { className: "input", type: "number", placeholder: "Pre\u00E7o do ticket (R$)", value: preco, onChange: e => setPreco(e.target.value) })] }), error && _jsx("p", { className: "text-red-500 text-sm", children: error }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => criar.mutate({ nome, premio, preco }), disabled: criar.isPending, className: "btn-primary", children: criar.isPending ? "Salvando..." : "Criar Rifa" }), _jsx("button", { onClick: () => setShowForm(false), className: "btn-secondary", children: "Cancelar" })] })] })), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [rifas.map((r) => (_jsxs("div", { className: "card p-6 space-y-4", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("div", { className: "size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-primary text-2xl", children: "confirmation_number" }) }), statusBadge(r.status)] }), _jsxs("div", { children: [_jsx("h4", { className: "font-bold text-lg", children: r.nome }), _jsxs("p", { className: "text-sm text-slate-500", children: ["Pr\u00EAmio: ", r.premio] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("p", { className: "text-xl font-black text-primary", children: fmt(r.preco) }), r.status === "ativa" && (_jsx("button", { onClick: () => { setSorteando(r.id); sortear.mutate(r.id); }, disabled: sorteando === r.id, className: "btn-primary py-1.5 px-3 text-xs", children: sorteando === r.id ? "Sorteando..." : "Sortear" }))] })] }, r.id))), rifas.length === 0 && (_jsx("div", { className: "col-span-3 text-center py-12 text-slate-400", children: "Nenhuma rifa criada ainda." }))] })] })] })] }));
}
