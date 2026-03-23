import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import BottomSheet from "../../components/ui/BottomSheet";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
export default function AlunoRifas() {
    const { auth } = useAuth();
    const qc = useQueryClient();
    const vendaSheet = useBottomSheet();
    const [selectedRifa, setSelectedRifa] = useState(null);
    const [compradorNome, setCompradorNome] = useState("");
    const [compradorContato, setCompradorContato] = useState("");
    const { data: rifas = [], isLoading: isLoadingRifas } = useQuery({
        queryKey: ["rifas"],
        queryFn: () => apiRequest("GET", "/rifas"),
        enabled: !!auth,
    });
    const { data: meusTickets = [] } = useQuery({
        queryKey: ["meus-tickets"],
        queryFn: () => apiRequest("GET", "/rifas/meus-tickets"),
        enabled: !!auth,
    });
    const vender = useMutation({
        mutationFn: (data) => apiRequest("POST", `/rifas/${selectedRifa?.id}/tickets`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["meus-tickets"] });
            vendaSheet.close();
            setSelectedRifa(null);
            setCompradorNome("");
            setCompradorContato("");
        },
    });
    const rifasAtivas = rifas.filter((r) => r.status === "ativa");
    return (_jsxs(MobileLayout, { role: "aluno", children: [_jsx(MobileHeader, { title: "Minhas Rifas", subtitle: "Venda e acompanhe resultados", gradient: true }), _jsxs("div", { className: "px-4 py-4 space-y-6", children: [_jsxs("section", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1", children: "Rifas Dispon\u00EDveis" }), isLoadingRifas ? (_jsx("div", { className: "space-y-3", children: [1, 2].map((i) => (_jsx("div", { className: "h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" }, i))) })) : rifasAtivas.length === 0 ? (_jsxs(MobileCard, { className: "text-center py-8 bg-slate-50 dark:bg-slate-800/50", children: [_jsx("span", { className: "material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block", children: "confirmation_number" }), _jsx("p", { className: "text-sm text-slate-500", children: "Nenhuma rifa ativa no momento." })] })) : (_jsx("div", { className: "grid gap-3 grid-cols-1", children: rifasAtivas.map((rifa) => (_jsx(MobileCard, { className: "p-4 border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20", children: _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "size-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner", children: _jsx("span", { className: "material-symbols-outlined text-2xl", children: "confirmation_number" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-bold text-slate-900 dark:text-white truncate", children: rifa.nome }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[10px]", children: "emoji_events" }), " ", rifa.premio] }), _jsxs("div", { className: "mt-3 flex items-center justify-between", children: [_jsx("span", { className: "text-xl font-black text-indigo-600 dark:text-indigo-400", children: formatCurrency(parseFloat(rifa.preco)) }), _jsx(MobileButton, { size: "sm", icon: "add_shopping_cart", onClick: () => { setSelectedRifa(rifa); vendaSheet.open(); }, children: "Vender" })] })] })] }) }, rifa.id))) }))] }), meusTickets.length > 0 && (_jsxs("section", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1", children: "Hist\u00F3rico de Vendas" }), _jsx("div", { className: "space-y-3", children: meusTickets.map((t) => (_jsxs("div", { className: "mobile-list-item", children: [_jsx("div", { className: "size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-slate-500 text-[20px]", children: "receipt" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm font-bold text-slate-900 dark:text-white truncate", children: ["Ticket #", String(t.id).padStart(4, '0')] }), _jsx("p", { className: "text-[10px] text-slate-500 truncate uppercase tracking-widest mt-0.5", children: t.compradorNome })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsx("p", { className: "text-sm font-black text-slate-900 dark:text-white", children: formatCurrency(parseFloat(t.valor)) }), _jsx("span", { className: `inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${t.status === "pago" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`, children: t.status })] })] }, t.id))) })] }))] }), _jsx(BottomSheet, { isOpen: vendaSheet.isOpen, onClose: () => { vendaSheet.close(); setSelectedRifa(null); }, title: "Registrar Venda", children: selectedRifa && (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl text-center border border-indigo-100 dark:border-indigo-900/50", children: [_jsx("p", { className: "text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1", children: selectedRifa.nome }), _jsx("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: formatCurrency(parseFloat(selectedRifa.preco)) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(MobileInput, { label: "Nome do Comprador", icon: "person", placeholder: "Nome completo", value: compradorNome, onChange: (e) => setCompradorNome(e.target.value) }), _jsx(MobileInput, { label: "Contato (opcional)", icon: "call", placeholder: "Telefone ou e-mail", value: compradorContato, onChange: (e) => setCompradorContato(e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: () => { vendaSheet.close(); setSelectedRifa(null); }, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: vender.isPending, disabled: !compradorNome, onClick: () => vender.mutate({ compradorNome, compradorContato, valor: selectedRifa.preco }), children: "Confirmar Venda" })] })] })) })] }));
}
