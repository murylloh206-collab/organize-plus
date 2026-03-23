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
export default function AdminConfiguracoes() {
    const qc = useQueryClient();
    const { auth } = useAuth();
    const archiveSheet = useBottomSheet();
    const [formData, setFormData] = useState({ nome: "", metaAlunos: "", novaSenha: "", confirmarSenha: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { data: sala } = useQuery({
        queryKey: ["sala", auth?.salaId],
        queryFn: () => apiRequest("GET", `/salas/${auth?.salaId}`),
        enabled: !!auth?.salaId,
    });
    const atualizarSala = useMutation({
        mutationFn: (data) => apiRequest("PATCH", `/salas/${auth?.salaId}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["sala", auth?.salaId] });
            showSuccess("Informações salvas!");
        },
        onError: (e) => showError(e.message),
    });
    const atualizarSenha = useMutation({
        mutationFn: (data) => apiRequest("PATCH", `/salas/${auth?.salaId}/senha`, data),
        onSuccess: () => { showSuccess("Senha alterada!"); setFormData((f) => ({ ...f, novaSenha: "", confirmarSenha: "" })); },
        onError: (e) => showError(e.message),
    });
    const arquivarTurma = useMutation({
        mutationFn: () => apiRequest("PATCH", `/salas/${auth?.salaId}/arquivar`, {}),
        onSuccess: () => { archiveSheet.close(); showSuccess("Turma arquivada!"); setTimeout(() => (window.location.href = "/admin/dashboard"), 2000); },
        onError: (e) => showError(e.message),
    });
    const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };
    const showError = (msg) => { setError(msg); setTimeout(() => setError(""), 3000); };
    const handleSaveInfo = () => {
        if (!formData.nome && !formData.metaAlunos)
            return;
        atualizarSala.mutate({ nome: formData.nome || sala?.nome, metaValor: formData.metaAlunos ? parseFloat(formData.metaAlunos) * 100 : undefined });
    };
    const handleUpdatePassword = () => {
        if (formData.novaSenha.length < 6) {
            showError("Senha deve ter no mínimo 6 caracteres");
            return;
        }
        if (formData.novaSenha !== formData.confirmarSenha) {
            showError("As senhas não conferem");
            return;
        }
        atualizarSenha.mutate({ senha: formData.novaSenha });
    };
    const Section = ({ icon, title, children }) => (_jsxs(MobileCard, { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl", children: icon }), _jsx("h2", { className: "text-sm font-bold text-slate-900 dark:text-white", children: title })] }), children] }));
    return (_jsxs(MobileLayout, { role: "admin", children: [_jsx(MobileHeader, { title: "Configura\u00E7\u00F5es", subtitle: "Turma e seguran\u00E7a", gradient: true }), _jsxs("div", { className: "px-4 py-4 space-y-4", children: [error && (_jsxs("div", { className: "p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center gap-2 text-sm text-red-600 dark:text-red-400", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "error" }), error] })), success && (_jsxs("div", { className: "p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "check_circle" }), success] })), _jsx(Section, { icon: "school", title: "Informa\u00E7\u00F5es da Turma", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs", children: [_jsx("span", { className: "text-slate-400", children: "C\u00F3digo da turma: " }), _jsx("span", { className: "font-mono font-bold text-slate-700 dark:text-slate-300", children: sala?.codigo || "—" })] }), _jsx(MobileInput, { label: "Nome da Turma", icon: "group", placeholder: sala?.nome || "Nome...", value: formData.nome, onChange: (e) => setFormData((f) => ({ ...f, nome: e.target.value })) }), _jsx(MobileInput, { label: "Meta Financeira (R$)", icon: "flag", type: "number", placeholder: "ex: 50000", value: formData.metaAlunos, onChange: (e) => setFormData((f) => ({ ...f, metaAlunos: e.target.value })) }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: atualizarSala.isPending, onClick: handleSaveInfo, children: "Salvar Altera\u00E7\u00F5es" })] }) }), _jsx(Section, { icon: "lock", title: "Seguran\u00E7a \u2014 Senha da Turma", children: _jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Alunos usam essa senha para entrar na turma." }), _jsx(MobileInput, { label: "Nova Senha", icon: "key", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: formData.novaSenha, onChange: (e) => setFormData((f) => ({ ...f, novaSenha: e.target.value })) }), _jsx(MobileInput, { label: "Confirmar Senha", icon: "key", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: formData.confirmarSenha, onChange: (e) => setFormData((f) => ({ ...f, confirmarSenha: e.target.value })) }), _jsx(MobileButton, { variant: "secondary", fullWidth: true, loading: atualizarSenha.isPending, onClick: handleUpdatePassword, children: "Atualizar Senha" })] }) }), _jsxs("div", { className: "border border-red-200 dark:border-red-900 rounded-2xl p-4 bg-red-50/50 dark:bg-red-950/20 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-red-600 text-xl", children: "warning" }), _jsx("h2", { className: "text-sm font-bold text-red-700 dark:text-red-400", children: "Zona de Perigo" })] }), _jsx("p", { className: "text-xs text-slate-600 dark:text-slate-400", children: "Ao arquivar, a turma ficar\u00E1 inativa mas os dados hist\u00F3ricos ser\u00E3o preservados." }), _jsx(MobileButton, { variant: "danger", fullWidth: true, icon: "archive", onClick: archiveSheet.open, children: "Arquivar Turma" })] })] }), _jsx(BottomSheet, { isOpen: archiveSheet.isOpen, onClose: archiveSheet.close, title: "Confirma\u00E7\u00E3o", children: _jsxs("div", { className: "space-y-4 text-center", children: [_jsx("div", { className: "size-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto", children: _jsx("span", { className: "material-symbols-outlined text-red-500 text-2xl", children: "warning" }) }), _jsxs("div", { children: [_jsxs("h3", { className: "text-base font-bold text-slate-900 dark:text-white", children: ["Arquivar \"", sala?.nome, "\"?"] }), _jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Esta a\u00E7\u00E3o remove a turma da visualiza\u00E7\u00E3o ativa." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: archiveSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "danger", fullWidth: true, loading: arquivarTurma.isPending, onClick: () => arquivarTurma.mutate(), children: "Arquivar" })] })] }) })] }));
}
