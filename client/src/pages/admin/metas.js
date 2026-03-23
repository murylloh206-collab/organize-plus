import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileAvatar from "../../components/ui/MobileAvatar";
import BottomSheet from "../../components/ui/BottomSheet";
import ProgressCircle from "../../components/ui/ProgressCircle";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";
export default function AdminMetas() {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const { id } = useParams();
    const criarSheet = useBottomSheet();
    const contribuirSheet = useBottomSheet();
    const deletaMetaSheet = useBottomSheet();
    const [metaParaExcluir, setMetaParaExcluir] = useState(null);
    const [error, setError] = useState("");
    // Criar meta
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [valorMeta, setValorMeta] = useState("");
    const [dataLimite, setDataLimite] = useState("");
    // Contribuição
    const [progressoValor, setProgressoValor] = useState("");
    const [progressoAlunoId, setProgressoAlunoId] = useState(null);
    const [progressoDescricao, setProgressoDescricao] = useState("");
    const [metaSelecionadaId, setMetaSelecionadaId] = useState(null);
    const { data: metas = [], isLoading } = useQuery({
        queryKey: ["metas"],
        queryFn: () => apiRequest("GET", "/metas"),
    });
    const { data: metaDetalhe } = useQuery({
        queryKey: ["meta", id],
        queryFn: () => apiRequest("GET", `/metas/${id}`),
        enabled: !!id,
    });
    const { data: contribuicoes = [] } = useQuery({
        queryKey: ["contribuicoes", id],
        queryFn: () => id ? apiRequest("GET", `/metas/${id}/contribuicoes`) : Promise.resolve([]),
        enabled: !!id,
    });
    const { data: alunos = [] } = useQuery({
        queryKey: ["alunos"],
        queryFn: () => apiRequest("GET", "/alunos"),
    });
    const criarMeta = useMutation({
        mutationFn: (data) => apiRequest("POST", "/metas", data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["metas"] });
            criarSheet.close();
            setTitulo("");
            setDescricao("");
            setValorMeta("");
            setDataLimite("");
            setError("");
        },
        onError: (e) => setError(e.message),
    });
    const deletarMeta = useMutation({
        mutationFn: (id) => apiRequest("DELETE", `/metas/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["metas"] });
            deletaMetaSheet.close();
            setMetaParaExcluir(null);
            if (id)
                navigate("/admin/metas");
        },
    });
    const adicionarContribuicao = useMutation({
        mutationFn: (data) => apiRequest("POST", `/metas/${metaSelecionadaId || id}/contribuicoes`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["meta", id || String(metaSelecionadaId)] });
            qc.invalidateQueries({ queryKey: ["contribuicoes", id || String(metaSelecionadaId)] });
            qc.invalidateQueries({ queryKey: ["metas"] });
            contribuirSheet.close();
            setProgressoValor("");
            setProgressoAlunoId(null);
            setProgressoDescricao("");
        },
        onError: (e) => setError(e.message),
    });
    const deletarContribuicao = useMutation({
        mutationFn: (cId) => apiRequest("DELETE", `/metas/contribuicoes/${cId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["meta", id] });
            qc.invalidateQueries({ queryKey: ["contribuicoes", id] });
            qc.invalidateQueries({ queryKey: ["metas"] });
        },
    });
    const calcDias = (data) => {
        if (!data)
            return null;
        const diff = new Date(data).getTime() - new Date().setHours(0, 0, 0, 0);
        return Math.ceil(diff / 86400000);
    };
    const diasBadge = (dias) => {
        if (dias === null)
            return null;
        const cls = dias < 0 ? "badge-error" : dias <= 7 ? "badge-warning" : "badge-success";
        const txt = dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? "Hoje" : `${dias}d`;
        return _jsx("span", { className: cls, children: txt });
    };
    // Página de detalhe
    if (id && metaDetalhe) {
        const va = parseFloat(metaDetalhe.valorAtual) || 0;
        const vm = parseFloat(metaDetalhe.valorMeta) || 0;
        const pct = vm > 0 ? (va / vm) * 100 : 0;
        const dias = calcDias(metaDetalhe.dataLimite);
        return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: metaDetalhe.titulo, subtitle: `${pct.toFixed(0)}% da meta`, showBack: true, gradient: true, actions: [
                        { icon: "add", onClick: () => { setMetaSelecionadaId(metaDetalhe.id); contribuirSheet.open(); }, label: "Contribuir" },
                        { icon: "delete", onClick: () => { setMetaParaExcluir(metaDetalhe.id); deletaMetaSheet.open(); }, label: "Excluir" },
                    ] }), _jsxs("div", { className: "px-4 py-4 space-y-4", children: [_jsxs(MobileCard, { variant: "gradient", className: "relative overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-white/70 font-medium", children: "Arrecadado" }), _jsx("p", { className: "text-3xl font-black text-white mt-1", children: formatCurrency(va) }), _jsxs("p", { className: "text-sm text-white/60 mt-1", children: ["de ", formatCurrency(vm)] }), dias !== null && (_jsxs("p", { className: "text-xs text-white/60 mt-2 flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "event" }), metaDetalhe.dataLimite ? formatDate(metaDetalhe.dataLimite) : "—", " ", dias < 0 ? `(${Math.abs(dias)}d atraso)` : dias === 0 ? "(Hoje)" : `(${dias}d)`] }))] }), _jsx(ProgressCircle, { value: pct, size: 96, strokeWidth: 8, color: "white" })] }), _jsx("div", { className: "mt-4 w-full bg-white/20 rounded-full h-2", children: _jsx("div", { className: "h-2 bg-white rounded-full transition-all duration-700", style: { width: `${Math.min(pct, 100)}%` } }) })] }), metaDetalhe.descricao && (_jsx(MobileCard, { children: _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: metaDetalhe.descricao }) })), _jsx(MobileButton, { variant: "primary", fullWidth: true, icon: "add", size: "lg", onClick: () => { setMetaSelecionadaId(metaDetalhe.id); contribuirSheet.open(); }, children: "Adicionar Contribui\u00E7\u00E3o" }), _jsxs("div", { children: [_jsxs("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3", children: ["Contribui\u00E7\u00F5es (", contribuicoes.length, ")"] }), contribuicoes.length > 0 ? (_jsx("div", { className: "space-y-2", children: contribuicoes.map((c) => (_jsxs("div", { className: "mobile-list-item", children: [_jsx(MobileAvatar, { name: c.alunoNome, size: "sm" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: c.alunoNome }), c.descricao && _jsx("p", { className: "text-xs text-slate-500 truncate", children: c.descricao }), _jsx("p", { className: "text-xs text-slate-400", children: formatDate(c.data) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(c.valor) }), _jsx("button", { onClick: () => { if (confirm("Remover contribuição?"))
                                                            deletarContribuicao.mutate(c.id); }, className: "p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: "delete" }) })] })] }, c.id))) })) : (_jsxs(MobileCard, { className: "text-center py-8", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl", children: "savings" }), _jsx("p", { className: "text-sm text-slate-400 mt-2", children: "Nenhuma contribui\u00E7\u00E3o ainda" })] }))] })] }), _jsx(BottomSheet, { isOpen: contribuirSheet.isOpen, onClose: contribuirSheet.close, title: "Adicionar Contribui\u00E7\u00E3o", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Valor (R$)", icon: "attach_money", type: "number", placeholder: "0.00", value: progressoValor, onChange: (e) => setProgressoValor(e.target.value) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Aluno contribuinte" }), _jsxs("select", { value: progressoAlunoId ?? "", onChange: (e) => setProgressoAlunoId(parseInt(e.target.value)), className: "mobile-input appearance-none", children: [_jsx("option", { value: "", children: "Selecionar aluno..." }), alunos.map((a) => _jsx("option", { value: a.id, children: a.nome }, a.id))] })] }), _jsx(MobileInput, { label: "Descri\u00E7\u00E3o (opcional)", icon: "note", placeholder: "ex: Bingo da turma", value: progressoDescricao, onChange: (e) => setProgressoDescricao(e.target.value) }), error && _jsx("p", { className: "text-sm text-red-500", children: error }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: contribuirSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: adicionarContribuicao.isPending, onClick: () => adicionarContribuicao.mutate({ valor: parseFloat(progressoValor), alunoId: progressoAlunoId, descricao: progressoDescricao, data: new Date().toISOString() }), children: "Salvar" })] })] }) }), _jsx(BottomSheet, { isOpen: deletaMetaSheet.isOpen, onClose: deletaMetaSheet.close, title: "Excluir Meta", children: _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Todas as contribui\u00E7\u00F5es ser\u00E3o removidas. Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita." }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: deletaMetaSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "danger", fullWidth: true, loading: deletarMeta.isPending, onClick: () => metaParaExcluir && deletarMeta.mutate(metaParaExcluir), children: "Excluir" })] })] }) })] }));
    }
    // Lista de metas
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: "Metas", subtitle: `${metas.length} metas`, gradient: true, actions: [{ icon: "add_circle", onClick: criarSheet.open, label: "Nova Meta" }] }), _jsx("div", { className: "px-4 py-4 space-y-3", children: isLoading ? (_jsx("div", { className: "space-y-3", children: [1, 2].map((i) => _jsx(Skeleton, { variant: "card" }, i)) })) : metas.length > 0 ? (metas.map((m) => {
                    const va = parseFloat(m.valorAtual) || 0;
                    const vm = parseFloat(m.valorMeta) || 0;
                    const pct = vm > 0 ? (va / vm) * 100 : 0;
                    const dias = calcDias(m.dataLimite);
                    const done = pct >= 100;
                    return (_jsx("div", { className: "mobile-card p-4 cursor-pointer", onClick: () => navigate(`/admin/metas/${m.id}`), children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `size-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-amber-100 dark:bg-amber-950/40"}`, children: _jsx("span", { className: `material-symbols-outlined text-xl ${done ? "text-emerald-600" : "text-amber-600"}`, children: done ? "check_circle" : "stars" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("p", { className: "text-sm font-bold text-slate-900 dark:text-white", children: m.titulo }), done && _jsx("span", { className: "badge-success text-xs", children: "Conclu\u00EDda" }), diasBadge(dias)] }), m.descricao && _jsx("p", { className: "text-xs text-slate-500 mt-0.5 line-clamp-1", children: m.descricao }), _jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex justify-between text-xs text-slate-500 mb-1", children: [_jsx("span", { children: formatCurrency(va) }), _jsxs("span", { className: "font-semibold text-indigo-600 dark:text-indigo-400", children: [pct.toFixed(0), "%"] })] }), _jsx("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : "gradient-primary"}`, style: { width: `${Math.min(pct, 100)}%` } }) }), _jsxs("p", { className: "text-xs text-slate-400 mt-1 text-right", children: ["Meta: ", formatCurrency(vm)] })] })] }), _jsx("button", { onClick: (e) => { e.stopPropagation(); setMetaParaExcluir(m.id); deletaMetaSheet.open(); }, className: "p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "delete" }) })] }) }, m.id));
                })) : (_jsxs(MobileCard, { className: "text-center py-12", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl", children: "flag" }), _jsx("p", { className: "text-slate-500 mt-3 text-sm", children: "Nenhuma meta criada" }), _jsx(MobileButton, { variant: "ghost", size: "sm", icon: "add_circle", className: "mt-3", onClick: criarSheet.open, children: "Criar meta" })] })) }), _jsx(BottomSheet, { isOpen: criarSheet.isOpen, onClose: criarSheet.close, title: "Nova Meta", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "T\u00EDtulo", icon: "flag", placeholder: "ex: Festa de Formatura", value: titulo, onChange: (e) => setTitulo(e.target.value) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { value: descricao, onChange: (e) => setDescricao(e.target.value), rows: 3, placeholder: "Descreva o objetivo...", className: "mobile-input resize-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileInput, { label: "Valor (R$)", icon: "attach_money", type: "number", placeholder: "0.00", value: valorMeta, onChange: (e) => setValorMeta(e.target.value) }), _jsx(MobileInput, { label: "Data Limite", icon: "event", type: "date", value: dataLimite, onChange: (e) => setDataLimite(e.target.value) })] }), error && _jsx("p", { className: "text-sm text-red-500", children: error }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: criarSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: criarMeta.isPending, onClick: () => {
                                        if (dataLimite) {
                                            apiRequest("POST", "/eventos", { titulo: `Fim da meta: ${titulo}`, descricao: `Data limite para a meta ${titulo}`, data: dataLimite, tipo: "meta", local: null, status: "planejado" }).catch(() => { });
                                        }
                                        criarMeta.mutate({ titulo, descricao, valorMeta, valorAtual: "0", dataLimite: dataLimite || null, salaId: auth?.salaId });
                                    }, children: "Criar Meta" })] })] }) }), _jsx(BottomSheet, { isOpen: deletaMetaSheet.isOpen, onClose: () => { deletaMetaSheet.close(); setMetaParaExcluir(null); }, title: "Excluir Meta", children: _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Todas as contribui\u00E7\u00F5es ser\u00E3o removidas permanentemente." }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: () => { deletaMetaSheet.close(); setMetaParaExcluir(null); }, children: "Cancelar" }), _jsx(MobileButton, { variant: "danger", fullWidth: true, loading: deletarMeta.isPending, onClick: () => metaParaExcluir && deletarMeta.mutate(metaParaExcluir), children: "Excluir" })] })] }) })] }));
}
