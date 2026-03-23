import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileAvatar from "../../components/ui/MobileAvatar";
import MobileBadge from "../../components/ui/MobileBadge";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileCard from "../../components/ui/MobileCard";
import MobileMetricCard from "../../components/ui/MobileMetricCard";
import BottomSheet from "../../components/ui/BottomSheet";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
import { formatDate } from "../../components/shared/DateFormat";
export default function AdminPagamentos() {
    const qc = useQueryClient();
    const formSheet = useBottomSheet();
    const reciboSheet = useBottomSheet();
    const [pagSelecionado, setPagSelecionado] = useState(null);
    const [filtroStatus, setFiltroStatus] = useState("todos");
    const [filtroNome, setFiltroNome] = useState("");
    const [error, setError] = useState("");
    // Form state
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [usuarioId, setUsuarioId] = useState("");
    const [vencimento, setVencimento] = useState("");
    const [formaPagamento, setFormaPagamento] = useState("pix");
    const { data: pagamentosRaw = [], isLoading, refetch } = useQuery({
        queryKey: ["pagamentos"],
        queryFn: () => apiRequest("GET", "/pagamentos"),
    });
    const pagamentos = pagamentosRaw.map((item) => ({
        ...item.pagamento,
        aluno: item.usuario,
    }));
    const { data: alunos = [] } = useQuery({
        queryKey: ["alunos"],
        queryFn: () => apiRequest("GET", "/alunos"),
    });
    const criar = useMutation({
        mutationFn: (data) => apiRequest("POST", "/pagamentos", data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["pagamentos"] });
            formSheet.close();
            setDescricao("");
            setValor("");
            setUsuarioId("");
            setVencimento("");
            setFormaPagamento("pix");
            refetch();
        },
        onError: (e) => setError(e.message),
    });
    const atualizar = useMutation({
        mutationFn: ({ id, ...data }) => apiRequest("PATCH", `/pagamentos/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["pagamentos"] });
            refetch();
        },
    });
    const deletar = useMutation({
        mutationFn: (id) => apiRequest("DELETE", `/pagamentos/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["pagamentos"] });
            reciboSheet.close();
            setPagSelecionado(null);
            refetch();
        },
    });
    // Stats
    const stats = useMemo(() => {
        const pagos = pagamentos.filter((p) => p.status === "pago");
        const pendentes = pagamentos.filter((p) => p.status === "pendente");
        const hoje = new Date();
        const atrasados = pagamentos.filter((p) => p.status !== "pago" && p.dataVencimento && new Date(p.dataVencimento) < hoje);
        return {
            totalArrecadado: pagos.reduce((a, p) => a + p.valor, 0),
            qtdPagos: pagos.length,
            totalPendente: pendentes.reduce((a, p) => a + p.valor, 0),
            qtdAtrasados: atrasados.length,
        };
    }, [pagamentos]);
    const filtrados = pagamentos.filter((p) => {
        const aluno = alunos.find((a) => a.id === p.usuarioId);
        const matchNome = !filtroNome || aluno?.nome?.toLowerCase().includes(filtroNome.toLowerCase());
        const matchStatus = filtroStatus === "todos" || p.status === filtroStatus;
        return matchNome && matchStatus;
    });
    const statusTabs = [
        { key: "todos", label: "Todos" },
        { key: "pendente", label: "Pendentes" },
        { key: "pago", label: "Pagos" },
        { key: "atrasado", label: "Atrasados" },
    ];
    const formaLabel = {
        pix: "Pix", cartao: "Cartão", boleto: "Boleto", dinheiro: "Dinheiro",
    };
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: "Pagamentos", subtitle: "Gest\u00E3o financeira", gradient: true, actions: [{ icon: "add_circle", onClick: formSheet.open, label: "Novo" }] }), _jsxs("div", { className: "px-4 py-4 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileMetricCard, { title: "Arrecadado", value: formatCurrency(stats.totalArrecadado), icon: "payments", color: "green", subtitle: `${stats.qtdPagos} pagtos` }), _jsx(MobileMetricCard, { title: "Pendentes", value: formatCurrency(stats.totalPendente), icon: "pending_actions", color: "amber" }), _jsx(MobileMetricCard, { title: "Atrasados", value: String(stats.qtdAtrasados), icon: "warning", color: "rose", subtitle: "boletos" }), _jsx(MobileMetricCard, { title: "Total", value: String(pagamentos.length), icon: "receipt_long", color: "primary", subtitle: "registros" })] }), _jsx(MobileInput, { icon: "search", placeholder: "Buscar por aluno...", value: filtroNome, onChange: (e) => setFiltroNome(e.target.value) }), _jsx("div", { className: "mobile-tab-bar", children: statusTabs.map((t) => (_jsx("button", { className: `mobile-tab-item ${filtroStatus === t.key ? "active" : ""}`, onClick: () => setFiltroStatus(t.key), children: t.label }, t.key))) }), isLoading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => _jsx(Skeleton, { variant: "card" }, i)) })) : filtrados.length > 0 ? (_jsx("div", { className: "space-y-2", children: filtrados.map((pag) => {
                            const aluno = alunos.find((a) => a.id === pag.usuarioId);
                            const hoje = new Date();
                            const venc = pag.dataVencimento ? new Date(pag.dataVencimento) : null;
                            const isAtrasado = pag.status !== "pago" && venc && venc < hoje;
                            const statusBadge = isAtrasado ? "atrasado" : pag.status;
                            return (_jsx(MobileCard, { className: "p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(MobileAvatar, { name: aluno?.nome, size: "md" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white truncate", children: aluno?.nome || "Aluno" }), _jsx(MobileBadge, { variant: statusBadge === "pago" ? "success" : statusBadge === "pendente" ? "warning" : "danger" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: pag.descricao }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsx("span", { className: "text-base font-black text-slate-900 dark:text-white", children: formatCurrency(pag.valor) }), _jsxs("span", { className: "text-xs text-slate-400", children: ["Venc: ", formatDate(pag.dataVencimento)] })] }), _jsxs("div", { className: "flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800", children: [_jsx("span", { className: "text-xs text-slate-400", children: formaLabel[pag.formaPagamento || "pix"] || "Pix" }), pag.status !== "pago" ? (_jsx("button", { onClick: () => atualizar.mutate({ id: pag.id, status: "pago", dataPagamento: new Date().toISOString(), formaPagamento: pag.formaPagamento || "pix" }), className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline", children: "Marcar Pago" })) : (_jsx("button", { onClick: () => { setPagSelecionado(pag); reciboSheet.open(); }, className: "text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors", children: "Ver Recibo" }))] })] })] }) }, pag.id));
                        }) })) : (_jsxs(MobileCard, { className: "text-center py-12", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl", children: "receipt_long" }), _jsx("p", { className: "text-slate-500 mt-3 text-sm", children: "Nenhum pagamento encontrado" }), _jsx(MobileButton, { variant: "ghost", size: "sm", icon: "add_circle", className: "mt-3", onClick: formSheet.open, children: "Registrar pagamento" })] }))] }), _jsx(BottomSheet, { isOpen: formSheet.isOpen, onClose: formSheet.close, title: "Novo Pagamento", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Aluno" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none", children: "person" }), _jsxs("select", { value: usuarioId, onChange: (e) => setUsuarioId(e.target.value), className: "mobile-input pl-11 appearance-none", children: [_jsx("option", { value: "", children: "Selecionar aluno..." }), alunos.map((a) => _jsx("option", { value: a.id, children: a.nome }, a.id))] })] })] }), _jsx(MobileInput, { label: "Descri\u00E7\u00E3o", icon: "description", placeholder: "ex: Mensalidade Mar\u00E7o", value: descricao, onChange: (e) => setDescricao(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileInput, { label: "Valor (R$)", icon: "attach_money", type: "number", step: "0.01", placeholder: "0,00", value: valor, onChange: (e) => setValor(e.target.value) }), _jsx(MobileInput, { label: "Vencimento", icon: "event", type: "date", value: vencimento, onChange: (e) => setVencimento(e.target.value) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Forma de Pagamento" }), _jsxs("select", { value: formaPagamento, onChange: (e) => setFormaPagamento(e.target.value), className: "mobile-input appearance-none", children: [_jsx("option", { value: "pix", children: "Pix" }), _jsx("option", { value: "cartao", children: "Cart\u00E3o" }), _jsx("option", { value: "boleto", children: "Boleto" }), _jsx("option", { value: "dinheiro", children: "Dinheiro" })] })] }), error && _jsx("p", { className: "text-sm text-red-500", children: error }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: formSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: criar.isPending, onClick: () => criar.mutate({ descricao, valor: parseFloat(valor), usuarioId: parseInt(usuarioId), dataVencimento: vencimento, formaPagamento, status: "pendente" }), children: "Salvar" })] })] }) }), pagSelecionado && (_jsx(BottomSheet, { isOpen: reciboSheet.isOpen, onClose: () => { reciboSheet.close(); setPagSelecionado(null); }, title: "Recibo de Pagamento", children: _jsxs("div", { className: "space-y-3", children: [[
                            { label: "Aluno", value: alunos.find((a) => a.id === pagSelecionado.usuarioId)?.nome || "—" },
                            { label: "Descrição", value: pagSelecionado.descricao },
                            { label: "Valor", value: formatCurrency(pagSelecionado.valor) },
                            { label: "Forma", value: formaLabel[pagSelecionado.formaPagamento] || "—" },
                            { label: "Data Pagamento", value: formatDate(pagSelecionado.dataPagamento) },
                        ].map((r) => (_jsxs("div", { className: "flex justify-between py-2 border-b border-slate-100 dark:border-slate-800", children: [_jsx("span", { className: "text-sm text-slate-500", children: r.label }), _jsx("span", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: r.value })] }, r.label))), _jsx(MobileButton, { variant: "danger", fullWidth: true, icon: "delete", loading: deletar.isPending, className: "mt-4", onClick: () => { if (confirm("Excluir pagamento?"))
                                deletar.mutate(pagSelecionado.id); }, children: "Excluir Pagamento" })] }) }))] }));
}
