import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileAvatar from "../../components/ui/MobileAvatar";
import MobileBadge from "../../components/ui/MobileBadge";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileCard from "../../components/ui/MobileCard";
import BottomSheet from "../../components/ui/BottomSheet";
import Skeleton from "../../components/ui/Skeleton";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../components/shared/CurrencyFormat";
const filtros = [
    { key: "todos", label: "Todos" },
    { key: "completed", label: "Pagos" },
    { key: "pending", label: "Pendentes" },
    { key: "overdue", label: "Inadimplentes" },
];
export default function AdminAlunos() {
    const qc = useQueryClient();
    const { auth } = useAuth();
    const addSheet = useBottomSheet();
    const editSheet = useBottomSheet();
    const [editingAluno, setEditingAluno] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("todos");
    // Form state - novo
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [celular, setCelular] = useState("");
    const [error, setError] = useState("");
    // Form state - edição
    const [editNome, setEditNome] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editCelular, setEditCelular] = useState("");
    const { data: alunos = [], isLoading } = useQuery({
        queryKey: ["alunos", auth?.salaId],
        queryFn: () => apiRequest("GET", `/alunos?salaId=${auth?.salaId}`),
        enabled: !!auth?.salaId,
    });
    const { data: pagamentos = [] } = useQuery({
        queryKey: ["pagamentos", auth?.salaId],
        queryFn: () => apiRequest("GET", `/pagamentos?salaId=${auth?.salaId}`),
        enabled: !!auth?.salaId,
    });
    const criar = useMutation({
        mutationFn: (data) => apiRequest("POST", "/alunos", data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["alunos"] });
            addSheet.close();
            setNome("");
            setEmail("");
            setSenha("");
            setCelular("");
            setError("");
        },
        onError: (e) => setError(e.message),
    });
    const editar = useMutation({
        mutationFn: ({ id, ...data }) => apiRequest("PUT", `/alunos/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["alunos"] });
            editSheet.close();
            setEditingAluno(null);
        },
    });
    const deletar = useMutation({
        mutationFn: (id) => apiRequest("DELETE", `/alunos/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["alunos"] }),
    });
    const getAlunoStatus = (alunoId) => {
        const pags = pagamentos.filter((p) => p.usuarioId === alunoId);
        if (pags.length === 0)
            return "pending";
        const temPago = pags.some((p) => p.status === "pago");
        const temPendente = pags.some((p) => p.status === "pending");
        if (temPago && !temPendente)
            return "completed";
        if (temPendente)
            return "pending";
        return "overdue";
    };
    const getTotalPago = (alunoId) => pagamentos
        .filter((p) => p.usuarioId === alunoId && p.status === "pago")
        .reduce((acc, p) => acc + p.valor, 0);
    const alunosFiltrados = alunos.filter((a) => {
        const match = [a.nome, a.email, a.celular].some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()));
        const st = getAlunoStatus(a.id);
        return match && (filtroStatus === "todos" || st === filtroStatus);
    });
    const handleEdit = (aluno) => {
        setEditingAluno(aluno);
        setEditNome(aluno.nome);
        setEditEmail(aluno.email);
        setEditCelular(aluno.celular || "");
        editSheet.open();
    };
    const statusVariantMap = {
        completed: "success",
        pending: "warning",
        overdue: "danger",
    };
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: "Alunos", subtitle: `${alunosFiltrados.length} alunos`, gradient: true, actions: [{ icon: "person_add", onClick: addSheet.open, label: "Adicionar" }] }), _jsxs("div", { className: "px-4 py-4 space-y-4", children: [_jsx(MobileInput, { icon: "search", placeholder: "Buscar por nome, email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }), _jsx("div", { className: "mobile-tab-bar", children: filtros.map((f) => (_jsx("button", { className: `mobile-tab-item ${filtroStatus === f.key ? "active" : ""}`, onClick: () => setFiltroStatus(f.key), children: f.label }, f.key))) }), isLoading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3, 4].map((i) => _jsx(Skeleton, { variant: "card" }, i)) })) : alunosFiltrados.length > 0 ? (_jsx("div", { className: "space-y-2", children: alunosFiltrados.map((aluno) => {
                            const st = getAlunoStatus(aluno.id);
                            const total = getTotalPago(aluno.id);
                            return (_jsxs("div", { className: "mobile-list-item justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [_jsx(MobileAvatar, { name: aluno.nome, size: "md" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white truncate", children: aluno.nome }), _jsx("p", { className: "text-xs text-slate-500 truncate", children: aluno.email })] })] }), _jsxs("div", { className: "flex flex-col items-end gap-1.5 flex-shrink-0", children: [_jsx(MobileBadge, { variant: statusVariantMap[st] || "neutral" }), _jsx("span", { className: "text-xs font-bold text-slate-700 dark:text-slate-300", children: formatCurrency(total) })] }), _jsxs("div", { className: "flex gap-1 ml-2", children: [_jsx("button", { onClick: () => handleEdit(aluno), className: "p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "edit" }) }), _jsx("button", { onClick: () => { if (confirm(`Remover ${aluno.nome}?`))
                                                    deletar.mutate(aluno.id); }, className: "p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "delete" }) })] })] }, aluno.id));
                        }) })) : (_jsxs(MobileCard, { className: "text-center py-12", children: [_jsx("span", { className: "material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl", children: "group" }), _jsx("p", { className: "text-slate-500 dark:text-slate-400 mt-3 text-sm font-medium", children: "Nenhum aluno encontrado" }), _jsx(MobileButton, { variant: "ghost", size: "sm", icon: "person_add", className: "mt-3", onClick: addSheet.open, children: "Adicionar aluno" })] }))] }), _jsx(BottomSheet, { isOpen: addSheet.isOpen, onClose: addSheet.close, title: "Novo Aluno", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Nome Completo", icon: "person", placeholder: "Nome completo", value: nome, onChange: (e) => setNome(e.target.value) }), _jsx(MobileInput, { label: "E-mail", icon: "mail", type: "email", placeholder: "email@exemplo.com", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx(MobileInput, { label: "Celular", icon: "smartphone", type: "tel", placeholder: "(00) 00000-0000", value: celular, onChange: (e) => setCelular(e.target.value) }), _jsx(MobileInput, { label: "Senha Tempor\u00E1ria", icon: "lock", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: senha, onChange: (e) => setSenha(e.target.value) }), error && _jsx("p", { className: "text-sm text-red-500", children: error }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: addSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: criar.isPending, onClick: () => criar.mutate({ nome, email, senha, celular, role: "aluno", salaId: auth?.salaId }), children: "Salvar" })] })] }) }), _jsx(BottomSheet, { isOpen: editSheet.isOpen, onClose: editSheet.close, title: "Editar Aluno", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Nome Completo", icon: "person", placeholder: "Nome", value: editNome, onChange: (e) => setEditNome(e.target.value) }), _jsx(MobileInput, { label: "E-mail", icon: "mail", type: "email", placeholder: "E-mail", value: editEmail, onChange: (e) => setEditEmail(e.target.value) }), _jsx(MobileInput, { label: "Celular", icon: "smartphone", type: "tel", placeholder: "Celular", value: editCelular, onChange: (e) => setEditCelular(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: editSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: editar.isPending, onClick: () => editar.mutate({ id: editingAluno?.id, nome: editNome, email: editEmail, celular: editCelular }), children: "Atualizar" })] })] }) })] }));
}
