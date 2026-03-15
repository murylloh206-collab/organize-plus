import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { apiRequest } from "../../lib/queryClient";
export default function AdminEventos() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [data, setData] = useState("");
    const [local, setLocal] = useState("");
    const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => apiRequest("GET", "/eventos") });
    const criar = useMutation({
        mutationFn: (d) => apiRequest("POST", "/eventos", d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["eventos"] }); setShowForm(false); setTitulo(""); setDescricao(""); setData(""); setLocal(""); },
    });
    const deletar = useMutation({
        mutationFn: (id) => apiRequest("DELETE", `/eventos/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
    });
    const statusBadge = (s) => {
        if (s === "planejado")
            return _jsx("span", { className: "badge-warning", children: "Planejado" });
        if (s === "realizado")
            return _jsx("span", { className: "badge-success", children: "Realizado" });
        return _jsx("span", { className: "badge-danger", children: "Cancelado" });
    };
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", children: [_jsx(Sidebar, { role: "admin" }), _jsxs("main", { className: "flex-1 flex flex-col overflow-y-auto ml-64", children: [_jsx(Header, { title: "Eventos" }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold", children: "Agenda de Eventos" }), _jsxs("p", { className: "text-sm text-slate-500", children: [eventos.length, " eventos"] })] }), _jsxs("button", { onClick: () => setShowForm(true), className: "btn-primary flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "add" }), " Novo Evento"] })] }), showForm && (_jsxs("div", { className: "card p-6 space-y-4", children: [_jsx("h4", { className: "font-bold", children: "Criar Evento" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("input", { className: "input", placeholder: "T\u00EDtulo", value: titulo, onChange: e => setTitulo(e.target.value) }), _jsx("input", { className: "input", placeholder: "Local", value: local, onChange: e => setLocal(e.target.value) }), _jsx("input", { className: "input", type: "datetime-local", value: data, onChange: e => setData(e.target.value) }), _jsx("input", { className: "input", placeholder: "Descri\u00E7\u00E3o", value: descricao, onChange: e => setDescricao(e.target.value) })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => criar.mutate({ titulo, descricao, local, data }), disabled: criar.isPending, className: "btn-primary", children: criar.isPending ? "Salvando..." : "Salvar" }), _jsx("button", { onClick: () => setShowForm(false), className: "btn-secondary", children: "Cancelar" })] })] })), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [eventos.map((ev) => (_jsxs("div", { className: "card p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("div", { className: "size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-primary text-2xl", children: "event" }) }), _jsxs("div", { className: "flex items-center gap-2", children: [statusBadge(ev.status), _jsx("button", { onClick: () => deletar.mutate(ev.id), className: "text-slate-400 hover:text-red-500 transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "delete" }) })] })] }), _jsx("h4", { className: "font-bold text-lg", children: ev.titulo }), ev.data && _jsx("p", { className: "text-sm text-slate-500 mt-1", children: new Date(ev.data).toLocaleString("pt-BR") }), ev.local && _jsxs("p", { className: "text-sm text-primary mt-1 flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "location_on" }), ev.local] }), ev.descricao && _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 mt-2", children: ev.descricao })] }, ev.id))), eventos.length === 0 && _jsx("div", { className: "col-span-3 text-center py-12 text-slate-400", children: "Nenhum evento criado ainda." })] })] })] })] }));
}
