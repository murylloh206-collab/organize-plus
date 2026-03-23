import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, queryClient } from "../../lib/queryClient";
import ThemeToggle from "../../components/ThemeToggle";
export default function CreateSalaPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    // Chave de acesso
    const [chaveAcesso, setChaveAcesso] = useState("");
    const [chaveValidada, setChaveValidada] = useState(false);
    const [validandoChave, setValidandoChave] = useState(false);
    const [erroChave, setErroChave] = useState("");
    // Campos da turma
    const [nomeTurma, setNomeTurma] = useState("");
    const [escola, setEscola] = useState("");
    const [ano, setAno] = useState(new Date().getFullYear().toString());
    const [metaTotal, setMetaTotal] = useState("");
    // Senha da turma
    const [senhaTurma, setSenhaTurma] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const formatarChave = (valor) => {
        // Remove tudo que não é letra ou número e deixa maiúsculo
        const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
        // Adiciona hífen a cada 4 caracteres
        const partes = limpo.match(/.{1,4}/g) || [];
        return partes.slice(0, 4).join("-");
    };
    const handleValidarChave = async () => {
        if (!chaveAcesso.trim()) {
            setErroChave("Digite a chave de acesso.");
            return;
        }
        setValidandoChave(true);
        setErroChave("");
        try {
            await apiRequest("POST", "/auth/validate-chave", { chave: chaveAcesso.trim() });
            setChaveValidada(true);
        }
        catch (err) {
            setErroChave(err.message || "Chave inválida ou já utilizada.");
        }
        finally {
            setValidandoChave(false);
        }
    };
    // Cálculo de força da senha
    const calcularForca = (s) => {
        let score = 0;
        if (s.length >= 8)
            score++;
        if (/[A-Z]/.test(s))
            score++;
        if (/[a-z]/.test(s))
            score++;
        if (/[0-9]/.test(s))
            score++;
        if (/[^A-Za-z0-9]/.test(s))
            score++;
        return score;
    };
    const forca = calcularForca(senhaTurma);
    const requisitos = [
        { label: "Mínimo 8 caracteres", ok: senhaTurma.length >= 8 },
        { label: "Letra maiúscula", ok: /[A-Z]/.test(senhaTurma) },
        { label: "Letra minúscula", ok: /[a-z]/.test(senhaTurma) },
        { label: "Número", ok: /[0-9]/.test(senhaTurma) },
        { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(senhaTurma) },
    ];
    const getCorBarra = () => {
        if (forca <= 2)
            return "#ef4444";
        if (forca <= 3)
            return "#f59e0b";
        return "#22c55e";
    };
    const getTextoForca = () => {
        if (forca <= 2)
            return "Fraca";
        if (forca <= 3)
            return "Média";
        return "Forte";
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!chaveValidada) {
            setError("Valide sua chave de acesso antes de criar a turma.");
            return;
        }
        if (senhaTurma !== confirmarSenha) {
            setError("As senhas não coincidem.");
            return;
        }
        if (forca < 3) {
            setError("Por favor, escolha uma senha mais forte para a turma.");
            return;
        }
        setLoading(true);
        try {
            const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
            const dataFormatura = `${ano}-12-01`;
            const sala = await apiRequest("POST", "/salas", {
                nome: nomeTurma,
                escola,
                ano: parseInt(ano),
                metaValor: parseFloat(metaTotal) || 0,
                senha: senhaTurma,
                codigo,
                dataFormatura,
                chaveUsada: chaveAcesso,
            });
            await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
            navigate("/admin/dashboard");
        }
        catch (err) {
            console.error("Erro ao criar turma:", err);
            setError(err.message || "Erro ao criar a turma. Tente novamente.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-900", children: [_jsxs("div", { className: "hidden md:flex md:w-5/12 lg:w-1/2 bg-[#1e3a5f] p-12 flex-col justify-between relative overflow-hidden", children: [_jsx("div", { className: "absolute w-[350px] h-[350px] rounded-full border border-[#c6a43f]/20 top-[-80px] right-[-80px]" }), _jsx("div", { className: "absolute w-[250px] h-[250px] rounded-full border border-[#c6a43f]/15 bottom-100px left-[-70px]" }), _jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center gap-3 mb-16", children: [_jsx("div", { className: "w-11 h-11 bg-[#c6a43f] rounded-lg flex items-center justify-center shadow-lg shadow-[#c6a43f]/30", children: _jsx("span", { className: "material-symbols-outlined text-white text-2xl", children: "layers" }) }), _jsx("h1", { className: "text-white text-2xl font-bold", children: "Organize+" })] }), _jsx("h2", { className: "text-white text-4xl font-black leading-tight mb-4", children: "Configure sua turma de formatura" }), _jsx("p", { className: "text-white/60 text-base", children: "Defina as informa\u00E7\u00F5es da sua turma. A senha criada aqui ser\u00E1 usada pelos alunos para entrar na plataforma." })] }), _jsx("div", { className: "relative z-10 space-y-4", children: [
                            { icon: "group", text: "Gerencie todos os alunos da turma" },
                            { icon: "payments", text: "Controle financeiro em tempo real" },
                            { icon: "event", text: "Planeje eventos e datas importantes" },
                        ].map((item, i) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-9 h-9 bg-[#c6a43f]/15 border border-[#c6a43f]/30 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-[#c6a43f] text-lg", children: item.icon }) }), _jsx("span", { className: "text-white/70 text-sm", children: item.text })] }, i))) }), _jsx("p", { className: "relative z-10 text-white/30 text-xs", children: "\u00A9 2026 Organize+ Plataforma de Formaturas" })] }), _jsx("div", { className: "flex-1 bg-[#f8fafc] dark:bg-slate-900 flex items-center justify-center p-6 md:p-8 overflow-y-auto", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "flex md:hidden items-center justify-between mb-8", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 bg-[#1e3a5f] rounded flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-[#c6a43f] text-sm", children: "layers" }) }), _jsx("span", { className: "font-bold text-[#1e3a5f] dark:text-white", children: "Organize+" })] }), _jsx(ThemeToggle, {})] }), _jsx("div", { className: "hidden md:block absolute top-6 right-6", children: _jsx(ThemeToggle, {}) }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "inline-flex items-center gap-2 bg-[#1e3a5f]/10 dark:bg-[#c6a43f]/10 px-4 py-2 rounded-full mb-4", children: [_jsx("span", { className: "material-symbols-outlined text-[#1e3a5f] dark:text-[#c6a43f] text-sm", children: "school" }), _jsx("span", { className: "text-xs font-bold text-[#1e3a5f] dark:text-[#c6a43f] uppercase", children: "Passo 2 de 2" })] }), _jsx("h1", { className: "text-3xl font-black text-[#1e3a5f] dark:text-white mb-2", children: "Criar sua Turma" }), _jsx("p", { className: "text-slate-600 dark:text-slate-400 text-sm", children: "Preencha os dados abaixo para configurar a turma de formatura." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: `bg-white dark:bg-slate-800 rounded-xl p-5 border ${chaveValidada ? 'border-green-500' : 'border-slate-200 dark:border-slate-700'}`, children: [_jsxs("h3", { className: "text-[#1e3a5f] dark:text-white font-bold text-sm flex items-center gap-2 mb-2", children: [_jsx("span", { className: `material-symbols-outlined text-sm ${chaveValidada ? 'text-green-500' : 'text-[#c6a43f]'}`, children: chaveValidada ? 'verified' : 'vpn_key' }), "Chave de Acesso", chaveValidada && (_jsx("span", { className: "text-green-500 text-xs font-semibold", children: "\u2713 Validada" }))] }), _jsx("p", { className: "text-slate-500 dark:text-slate-400 text-xs mb-3", children: "Insira a chave de acesso vital\u00EDcia que voc\u00EA adquiriu para criar sua turma." }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base", children: "key" }), _jsx("input", { type: "text", value: chaveAcesso, onChange: (e) => {
                                                                setChaveAcesso(formatarChave(e.target.value));
                                                                setChaveValidada(false);
                                                                setErroChave("");
                                                            }, placeholder: "XXXX-XXXX-XXXX-XXXX", disabled: chaveValidada, maxLength: 19, className: `w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border transition-all ${chaveValidada
                                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-slate-900 dark:text-white'
                                                                : erroChave
                                                                    ? 'border-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                                                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent'} placeholder-slate-400 dark:placeholder-slate-500` })] }), _jsx("button", { type: "button", onClick: handleValidarChave, disabled: validandoChave || chaveValidada, className: `px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${chaveValidada
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-[#1e3a5f] hover:bg-[#0f2a4a] text-white'} disabled:opacity-50`, children: validandoChave ? "..." : chaveValidada ? "✓ OK" : "Validar" })] }), erroChave && (_jsx("p", { className: "text-red-500 text-xs mt-2 font-medium", children: erroChave }))] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700", children: [_jsxs("h3", { className: "text-[#1e3a5f] dark:text-white font-bold text-sm flex items-center gap-2 mb-4", children: [_jsx("span", { className: "material-symbols-outlined text-[#c6a43f] text-sm", children: "info" }), "Dados da Turma"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5", children: "Nome da Turma *" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "groups" }), _jsx("input", { type: "text", value: nomeTurma, onChange: (e) => setNomeTurma(e.target.value), placeholder: "Ex: Medicina - Turma Alpha", required: true, className: "w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5", children: "Institui\u00E7\u00E3o / Escola *" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "school" }), _jsx("input", { type: "text", value: escola, onChange: (e) => setEscola(e.target.value), placeholder: "Ex: Terceir\u00E3o ADM", required: true, className: "w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5", children: "Ano de Formatura *" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "calendar_month" }), _jsx("input", { type: "number", value: ano, onChange: (e) => setAno(e.target.value), min: "2024", max: "2035", required: true, className: "w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5", children: "Meta Total (R$)" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "paid" }), _jsx("input", { type: "number", value: metaTotal, onChange: (e) => setMetaTotal(e.target.value), placeholder: "0,00", min: "0", step: "0.01", className: "w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all" })] })] })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700", children: [_jsxs("h3", { className: "text-[#1e3a5f] dark:text-white font-bold text-sm flex items-center gap-2 mb-2", children: [_jsx("span", { className: "material-symbols-outlined text-[#c6a43f] text-sm", children: "lock" }), "Senha da Turma"] }), _jsx("p", { className: "text-slate-500 dark:text-slate-400 text-xs mb-4", children: "Esta senha ser\u00E1 compartilhada com os alunos para que eles possam entrar na turma." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5", children: "Criar Senha *" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "key" }), _jsx("input", { type: mostrarSenha ? "text" : "password", value: senhaTurma, onChange: (e) => setSenhaTurma(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, className: "w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all" }), _jsx("button", { type: "button", onClick: () => setMostrarSenha(!mostrarSenha), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: mostrarSenha ? "visibility_off" : "visibility" }) })] }), senhaTurma && (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "flex gap-1 h-1 mb-2", children: [1, 2, 3, 4, 5].map((i) => (_jsx("div", { className: `flex-1 h-full rounded-full transition-all ${i <= forca ? `bg-[${getCorBarra()}]` : "bg-slate-200 dark:bg-slate-700"}` }, i))) }), _jsxs("p", { className: "text-xs text-slate-500", children: ["For\u00E7a: ", _jsx("span", { style: { color: getCorBarra() }, children: getTextoForca() })] })] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5", children: "Confirmar Senha *" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "lock_open" }), _jsx("input", { type: mostrarSenha ? "text" : "password", value: confirmarSenha, onChange: (e) => setConfirmarSenha(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, className: `w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border ${confirmarSenha && confirmarSenha !== senhaTurma
                                                                        ? 'border-red-500'
                                                                        : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#c6a43f] focus:border-transparent transition-all` })] }), confirmarSenha && confirmarSenha !== senhaTurma && (_jsx("p", { className: "text-red-500 text-xs mt-1 font-medium", children: "As senhas n\u00E3o coincidem." }))] }), senhaTurma && (_jsxs("div", { className: "bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800", children: [_jsx("p", { className: "text-xs font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Requisitos:" }), requisitos.map((req, i) => (_jsxs("div", { className: "flex items-center gap-2 py-0.5", children: [_jsx("span", { className: `material-symbols-outlined text-xs ${req.ok ? 'text-green-500' : 'text-slate-400'}`, children: req.ok ? 'check_circle' : 'radio_button_unchecked' }), _jsx("span", { className: `text-xs ${req.ok ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`, children: req.label })] }, i)))] }))] })] }), error && (_jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-red-500 text-sm", children: "error" }), _jsx("p", { className: "text-red-600 dark:text-red-400 text-xs font-medium", children: error })] })), _jsx("button", { type: "submit", disabled: loading || !chaveValidada, className: `w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${loading || !chaveValidada
                                        ? 'bg-slate-300 dark:bg-slate-700 text-white cursor-not-allowed'
                                        : 'bg-[#1e3a5f] hover:bg-[#0f2a4a] text-white shadow-lg shadow-[#1e3a5f]/30'}`, children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), _jsx("span", { className: "text-sm", children: "Criando turma..." })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "add_circle" }), _jsx("span", { className: "text-sm", children: "Criar Turma" })] })) }), _jsx("p", { className: "text-center text-xs text-slate-400 dark:text-slate-600", children: "Voc\u00EA poder\u00E1 editar essas informa\u00E7\u00F5es depois nas configura\u00E7\u00F5es." })] })] }) })] }));
}
