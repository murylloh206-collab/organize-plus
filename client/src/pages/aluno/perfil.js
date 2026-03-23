import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "../../components/layout/MobileLayout";
import MobileHeader from "../../components/layout/MobileHeader";
import MobileCard from "../../components/ui/MobileCard";
import MobileButton from "../../components/ui/MobileButton";
import MobileInput from "../../components/ui/MobileInput";
import MobileAvatar from "../../components/ui/MobileAvatar";
import BottomSheet from "../../components/ui/BottomSheet";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
export default function AlunoPerfil() {
    const qc = useQueryClient();
    const { auth, logout } = useAuth();
    const editSheet = useBottomSheet();
    const passSheet = useBottomSheet();
    const logoutSheet = useBottomSheet();
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [fotoPerfil, setFotoPerfil] = useState(null);
    const { data: me, refetch } = useQuery({
        queryKey: ["me"],
        queryFn: () => apiRequest("GET", "/alunos/me"),
        enabled: !!auth,
    });
    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8)
            strength++;
        if (/[A-Z]/.test(password))
            strength++;
        if (/[0-9]/.test(password))
            strength++;
        if (/[^A-Za-z0-9]/.test(password))
            strength++;
        if (strength <= 1)
            return { color: "text-red-500", bar: "bg-red-500", width: 25 };
        if (strength === 2)
            return { color: "text-amber-500", bar: "bg-amber-500", width: 50 };
        if (strength === 3)
            return { color: "text-blue-500", bar: "bg-blue-500", width: 75 };
        return { color: "text-emerald-500", bar: "bg-emerald-500", width: 100 };
    };
    const strength = novaSenha ? getPasswordStrength(novaSenha) : null;
    const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };
    const showError = (msg) => { setError(msg); setTimeout(() => setError(""), 3000); };
    const atualizarPerfil = useMutation({
        mutationFn: (data) => apiRequest("PATCH", "/alunos/me", data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); editSheet.close(); showSuccess("Perfil atualizado!"); refetch(); },
        onError: (e) => showError(e.message),
    });
    const atualizarSenha = useMutation({
        mutationFn: (data) => apiRequest("PATCH", "/alunos/senha", data),
        onSuccess: () => { passSheet.close(); showSuccess("Senha alterada!"); setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha(""); },
        onError: (e) => showError(e.message),
    });
    const handleSaveInfo = () => {
        const updateData = {};
        if (nome && nome !== me?.nome)
            updateData.nome = nome;
        if (telefone && telefone !== me?.celular)
            updateData.celular = telefone;
        if (Object.keys(updateData).length > 0)
            atualizarPerfil.mutate(updateData);
        else
            editSheet.close();
    };
    const handleUpdatePassword = () => {
        if (!senhaAtual || !novaSenha || !confirmarSenha)
            return showError("Preencha todos os campos");
        if (novaSenha.length < 6)
            return showError("A nova senha deve ter no mínimo 6 caracteres");
        if (novaSenha !== confirmarSenha)
            return showError("As senhas não conferem");
        atualizarSenha.mutate({ senhaAtual, novaSenha });
    };
    const handleFotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFotoPerfil(reader.result);
            reader.readAsDataURL(file);
        }
    };
    const openEdit = () => { setNome(me?.nome || ""); setTelefone(me?.celular || ""); editSheet.open(); };
    return (_jsxs(MobileLayout, { role: "aluno", children: [_jsx(MobileHeader, { title: "Perfil", subtitle: "Gerencie sua conta", gradient: true }), _jsxs("div", { className: "px-4 py-4 space-y-4", children: [error && _jsxs("div", { className: "p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 text-sm flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "error" }), error] }), success && _jsxs("div", { className: "p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-600 text-sm flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "check_circle" }), success] }), _jsxs(MobileCard, { className: "overflow-hidden", children: [_jsxs("div", { className: "flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800", children: [_jsxs("div", { className: "relative mb-3", children: [_jsx("div", { className: "size-24 rounded-full overflow-hidden border-4 border-indigo-50 dark:border-indigo-900/30 flex items-center justify-center bg-slate-100 dark:bg-slate-800", children: fotoPerfil || me?.avatarUrl ? _jsx("img", { src: fotoPerfil || me?.avatarUrl, alt: "Avatar", className: "w-full h-full object-cover" }) : _jsx(MobileAvatar, { name: me?.nome || "?", size: "lg" }) }), _jsxs("label", { className: "absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "photo_camera" }), _jsx("input", { type: "file", accept: "image/*", onChange: handleFotoUpload, className: "hidden" })] })] }), _jsx("h2", { className: "text-xl font-black text-slate-900 dark:text-white", children: me?.nome || "Carregando..." }), _jsx("p", { className: "text-sm text-slate-500", children: me?.email }), _jsx("span", { className: "mt-2 inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full", children: "Aluno Ativo" })] }), _jsxs("div", { className: "p-4 space-y-4", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: "Celular" }), _jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white mt-0.5", children: me?.celular || "Não informado" })] }) }), _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: "Matr\u00EDcula" }), _jsxs("p", { className: "text-sm font-semibold text-slate-900 dark:text-white mt-0.5", children: ["#", me?.id || "..."] })] }) })] }), _jsx("div", { className: "px-4 pb-4", children: _jsx(MobileButton, { variant: "ghost", fullWidth: true, icon: "edit", onClick: openEdit, children: "Editar Informa\u00E7\u00F5es" }) })] }), _jsxs(MobileCard, { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "material-symbols-outlined text-indigo-600 dark:text-indigo-400", children: "lock" }), _jsx("h3", { className: "text-sm font-bold text-slate-900 dark:text-white", children: "Seguran\u00E7a" })] }), _jsx("p", { className: "text-xs text-slate-500 mb-4", children: "Mantenha sua conta segura atualizando sua senha regularmente." }), _jsx(MobileButton, { variant: "secondary", fullWidth: true, icon: "password", onClick: passSheet.open, children: "Alterar Senha" })] }), _jsx(MobileButton, { variant: "danger", fullWidth: true, icon: "logout", onClick: logoutSheet.open, children: "Sair da Conta" }), _jsx("div", { className: "text-center pt-4 pb-8", children: _jsxs("p", { className: "text-xs text-slate-400", children: ["Precisa de ajuda? ", _jsx("a", { href: "/suporte", className: "text-primary font-bold hover:underline", children: "Fale com o Suporte" })] }) })] }), _jsx(BottomSheet, { isOpen: editSheet.isOpen, onClose: editSheet.close, title: "Editar Informa\u00E7\u00F5es", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Nome Completo", icon: "person", value: nome, onChange: (e) => setNome(e.target.value) }), _jsx(MobileInput, { label: "Celular", icon: "call", placeholder: "(11) 90000-0000", value: telefone, onChange: (e) => setTelefone(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: editSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: atualizarPerfil.isPending, onClick: handleSaveInfo, children: "Salvar" })] })] }) }), _jsx(BottomSheet, { isOpen: passSheet.isOpen, onClose: passSheet.close, title: "Alterar Senha", children: _jsxs("div", { className: "space-y-4", children: [_jsx(MobileInput, { label: "Senha Atual", type: "password", icon: "lock", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: senhaAtual, onChange: (e) => setSenhaAtual(e.target.value) }), _jsxs("div", { children: [_jsx(MobileInput, { label: "Nova Senha", type: "password", icon: "key", placeholder: "M\u00EDnimo 6 caracteres", value: novaSenha, onChange: (e) => setNovaSenha(e.target.value) }), strength && (_jsxs("div", { className: "mt-2 flex gap-1 h-1 px-1", children: [_jsx("div", { className: `flex-1 rounded-full ${strength.width >= 25 ? strength.bar : "bg-slate-200 dark:bg-slate-800"}` }), _jsx("div", { className: `flex-1 rounded-full ${strength.width >= 50 ? strength.bar : "bg-slate-200 dark:bg-slate-800"}` }), _jsx("div", { className: `flex-1 rounded-full ${strength.width >= 75 ? strength.bar : "bg-slate-200 dark:bg-slate-800"}` }), _jsx("div", { className: `flex-1 rounded-full ${strength.width >= 100 ? strength.bar : "bg-slate-200 dark:bg-slate-800"}` })] }))] }), _jsx(MobileInput, { label: "Confirmar Nova Senha", type: "password", icon: "check", placeholder: "Repetir senha", value: confirmarSenha, onChange: (e) => setConfirmarSenha(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: passSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "primary", fullWidth: true, loading: atualizarSenha.isPending, onClick: handleUpdatePassword, children: "Atualizar" })] })] }) }), _jsx(BottomSheet, { isOpen: logoutSheet.isOpen, onClose: logoutSheet.close, title: "Sair da Conta", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "size-14 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto text-rose-500", children: _jsx("span", { className: "material-symbols-outlined text-2xl", children: "logout" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-base font-bold text-slate-900 dark:text-white", children: "Deseja realmente sair?" }), _jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Sua sess\u00E3o ser\u00E1 encerrada no dispositivo." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MobileButton, { variant: "secondary", fullWidth: true, onClick: logoutSheet.close, children: "Cancelar" }), _jsx(MobileButton, { variant: "danger", fullWidth: true, onClick: () => logout.mutate(), children: "Sair" })] })] }) })] }));
}
