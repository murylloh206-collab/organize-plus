import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileBadge from "../../components/ui/MobileBadge";
import BottomSheet from "../../components/ui/BottomSheet";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
const tipoIcon = {
    formatura: "school",
    ensaio: "music_note",
    reuniao: "groups",
    festa: "celebration",
    meta: "flag",
    outro: "event",
};
const tipoLabel = {
    formatura: "🎓 Formatura",
    ensaio: "📸 Ensaio",
    reuniao: "👥 Reunião",
    festa: "🎉 Festa",
    meta: "🎯 Meta",
    outro: "📌 Outro",
};
export default function AdminEventos() {
    const { auth } = useAuth();
    const qc = useQueryClient();
    const formSheet = useBottomSheet();
    const [error, setError] = useState("");
    // Form
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [data, setData] = useState("");
    const [tipo, setTipo] = useState("outro");
    const [local, setLocal] = useState("");
    const { data: eventos = [], isLoading } = useQuery({
        queryKey: ["eventos", auth?.salaId],
        queryFn: () => apiRequest("GET", `/eventos?salaId=${auth?.salaId}`),
        enabled: !!auth?.salaId,
    });
    const criar = useMutation({
        mutationFn: (d) => apiRequest("POST", "/eventos", d),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["eventos"] });
            formSheet.close();
            setTitulo("");
            setDescricao("");
            setData("");
            setTipo("outro");
            setLocal("");
            setError("");
        },
        onError: (e) => setError(e.message),
    });
    const deletar = useMutation({
        mutationFn: (id) => apiRequest("DELETE", `/eventos/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["eventos"] }),
    });
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const futuros = eventos.filter((e) => new Date(e.data) >= hoje).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const passados = eventos.filter((e) => new Date(e.data) < hoje).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const EventoCard = ({ evento }) => {
        const d = new Date(evento.data);
        const isPassado = d < hoje;
        const dias = Math.ceil((d.getTime() - hoje.getTime()) / 86400000);
        return (_jsx(MobileCard, { className: `p-4 ${isPassado ? "opacity-60" : ""} hover:shadow-md transition-all`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsxs("div", { className: "size-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex flex-col items-center justify-center flex-shrink-0", children: [_jsx("span", { className: "text-lg font-black text-primary dark:text-primary", children: d.getDate() }), _jsx("span", { className: "text-[9px] uppercase font-bold text-primary/70", children: d.toLocaleString("pt-BR", { month: "short" }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-sm font-bold text-slate-900 dark:text-white", children: evento.titulo }), _jsx(MobileBadge, { variant: "neutral", className: "text-[10px]", children: tipoLabel[evento.tipo] || evento.tipo })] }), evento.descricao && _jsx("p", { className: "text-xs text-slate-500 mt-0.5 line-clamp-2", children: evento.descricao }), _jsxs("div", { className: "flex items-center gap-2 mt-1.5 flex-wrap", children: [evento.local && (_jsxs("span", { className: "text-xs text-slate-400 flex items-center gap-0.5", children: [_jsx("span", { className: "material-symbols-outlined text-xs", children: "location_on" }), evento.local] })), !isPassado && dias >= 0 && (_jsx("span", { className: `text-xs font-semibold ${dias === 0 ? "text-gold dark:text-gold" :
                                            dias <= 3 ? "text-danger" :
                                                "text-success"}`, children: dias === 0 ? "🔥 Hoje" : `📅 Em ${dias} dias` }))] })] }), _jsx("button", { onClick: () => { if (confirm("Excluir evento?"))
                            deletar.mutate(evento.id); }, className: "p-1.5 text-slate-400 hover:text-danger rounded-lg transition-colors active:scale-90", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "delete" }) })] }) }));
    };
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: "Eventos", subtitle: "Calend\u00E1rio da turma", gradient: true, actions: [{ icon: "add_circle", onClick: formSheet.open, label: "Novo" }] }), _jsx("div", { className: "px-4 py-4 space-y-4", children: isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => _jsx(Skeleton, { variant: "card" }, i)) })) : (_jsxs(_Fragment, { children: [futuros.length > 0 && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "material-symbols-outlined text-gold text-lg", children: "event_upcoming" }), _jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wide", children: "Pr\u00F3ximos Eventos" }), _jsx(MobileBadge, { variant: "gold", className: "text-[10px]", children: futuros.length })] }), _jsx("div", { className: "space-y-2", children: futuros.map((e) => _jsx(EventoCard, { evento: e }, e.id)) })] })), passados.length > 0 && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "material-symbols-outlined text-slate-400 text-lg", children: "history" }), _jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wide", children: "Eventos Passados" }), _jsx(MobileBadge, { variant: "neutral", className: "text-[10px]", children: passados.length })] }), _jsx("div", { className: "space-y-2", children: passados.map((e) => _jsx(EventoCard, { evento: e }, e.id)) })] })), eventos.length === 0 && (_jsxs(MobileCard, { className: "text-center py-12", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl", children: "event" }), _jsx("p", { className: "text-slate-500 mt-3 text-sm", children: "Nenhum evento cadastrado" }), _jsx(MobileButton, { variant: "primary", size: "sm", icon: "add_circle", className: "mt-3", onClick: formSheet.open, children: "Criar evento" })] }))] })) }), _jsx(BottomSheet, { isOpen: formSheet.isOpen, onClose: formSheet.close, title: "Novo Evento", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "T\u00EDtulo", icon: "event", placeholder: "ex: Ensaio de formatura", value: titulo, onChange: (e) => setTitulo(e.target.value) }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-gold text-sm", children: "category" }), "Tipo"] }), _jsxs("select", { value: tipo, onChange: (e) => setTipo(e.target.value), className: "mobile-input appearance-none", children: [_jsx("option", { value: "formatura", children: "\uD83C\uDF93 Formatura" }), _jsx("option", { value: "ensaio", children: "\uD83D\uDCF8 Ensaio" }), _jsx("option", { value: "reuniao", children: "\uD83D\uDC65 Reuni\u00E3o" }), _jsx("option", { value: "festa", children: "\uD83C\uDF89 Festa" }), _jsx("option", { value: "meta", children: "\uD83C\uDFAF Meta" }), _jsx("option", { value: "outro", children: "\uD83D\uDCCC Outro" })] })] }), _jsx(MobileInput, { label: "Data", icon: "calendar_today", type: "date", value: data, onChange: (e) => setData(e.target.value) }), _jsx(MobileInput, { label: "Local (opcional)", icon: "location_on", placeholder: "ex: Audit\u00F3rio Central", value: local, onChange: (e) => setLocal(e.target.value) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Descri\u00E7\u00E3o (opcional)" }), _jsx("textarea", { value: descricao, onChange: (e) => setDescricao(e.target.value), rows: 2, className: "mobile-input resize-none", placeholder: "Detalhes do evento..." })] }), error && _jsx("p", { className: "text-sm text-danger", children: error }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: formSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: criar.isPending, onClick: () => criar.mutate({
                                        titulo,
                                        descricao,
                                        data,
                                        tipo,
                                        local: local || null,
                                        status: "planejado",
                                        salaId: auth?.salaId
                                    }), children: "Criar Evento" })] })] }) })] }));
}
