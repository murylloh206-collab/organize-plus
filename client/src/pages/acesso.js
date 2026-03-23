import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import MobileInput from "../components/ui/MobileInput";
import MobileButton from "../components/ui/MobileButton";
export default function AcessoPage() {
    const navigate = useNavigate();
    const { login, registerAluno, registerComissao } = useAuth();
    const [modo, setModo] = useState("entrar");
    const [tipo, setTipo] = useState("aluno");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    // Campos comuns
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    // Campos de cadastro
    const [nome, setNome] = useState("");
    const [celular, setCelular] = useState("");
    const [turmaId, setTurmaId] = useState("");
    const [senhaTurma, setSenhaTurma] = useState("");
    // Turmas
    const [turmas, setTurmas] = useState([]);
    const [carregandoTurmas, setCarregandoTurmas] = useState(false);
    useEffect(() => {
        if (modo === "cadastrar" && tipo === "aluno") {
            setCarregandoTurmas(true);
            fetch("/api/salas")
                .then((r) => r.json())
                .then((data) => setTurmas(data))
                .catch(() => { })
                .finally(() => setCarregandoTurmas(false));
        }
    }, [modo, tipo]);
    // Força de senha
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
    const forca = calcularForca(senha);
    const forcaColor = forca <= 2 ? "bg-red-500" : forca <= 3 ? "bg-amber-500" : "bg-emerald-500";
    const forcaText = forca <= 2 ? "Fraca" : forca <= 3 ? "Média" : "Forte";
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (modo === "entrar") {
                const user = await login.mutateAsync({ email, senha });
                navigate(user.role === "admin" ? "/admin/dashboard" : "/aluno/dashboard");
            }
            else if (tipo === "aluno") {
                await registerAluno.mutateAsync({ nome, email, senha, celular, turmaId, senhaTurma });
                navigate("/aluno/dashboard");
            }
            else {
                await registerComissao.mutateAsync({ nome, email, senha, celular });
                navigate("/admin/create-sala");
            }
        }
        catch (err) {
            setError(err.message || "Erro ao processar");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [_jsxs("div", { className: "h-44 gradient-primary relative overflow-hidden flex-shrink-0", children: [_jsx("div", { className: "absolute inset-0 opacity-20", style: { backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 0)", backgroundSize: "20px 20px" } }), _jsx(Link, { to: "/", className: "absolute top-5 left-5 p-2 rounded-xl bg-white/20 text-white", children: _jsx("span", { className: "material-symbols-outlined", children: "arrow_back" }) }), _jsxs("div", { className: "absolute bottom-8 left-6", children: [_jsx("h1", { className: "text-2xl font-black text-white tracking-tight", children: modo === "entrar" ? "Bem-vindo de volta 👋" : "Criar conta" }), _jsx("p", { className: "text-indigo-200 text-sm font-medium mt-1", children: modo === "entrar" ? "Acesse sua conta Organize+" : "Junte-se ao Organize+" })] })] }), _jsxs("div", { className: "flex-1 -mt-6 bg-background rounded-t-3xl relative z-10 px-5 pt-6 pb-10 max-w-lg mx-auto w-full", children: [_jsxs("div", { className: "mobile-tab-bar mb-6", children: [_jsx("button", { className: `mobile-tab-item flex-1 ${modo === "entrar" ? "active" : ""}`, onClick: () => { setModo("entrar"); setError(""); }, children: "Entrar" }), _jsx("button", { className: `mobile-tab-item flex-1 ${modo === "cadastrar" ? "active" : ""}`, onClick: () => { setModo("cadastrar"); setError(""); }, children: "Criar conta" })] }), modo === "cadastrar" && (_jsx("div", { className: "grid grid-cols-2 gap-2 mb-6", children: ["aluno", "comissao"].map((t) => (_jsx("button", { type: "button", onClick: () => setTipo(t), className: `py-3 rounded-xl text-sm font-semibold border-2 transition-all ${tipo === t
                                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                : "border-slate-200 dark:border-slate-700 text-slate-500"}`, children: t === "aluno" ? "🎓 Sou Aluno" : "⚡ Sou Comissão" }, t))) })), modo === "cadastrar" && tipo === "comissao" && (_jsxs("div", { className: "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3 mb-5 flex gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-amber-600 text-lg flex-shrink-0 mt-0.5", children: "info" }), _jsx("p", { className: "text-xs text-amber-800 dark:text-amber-300 leading-relaxed", children: "Ap\u00F3s criar, voc\u00EA precisar\u00E1 de uma chave de acesso para criar turmas." })] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [modo === "cadastrar" && (_jsx(MobileInput, { label: "Nome Completo", icon: "person", placeholder: "Seu nome completo", value: nome, onChange: (e) => setNome(e.target.value), required: true, autoComplete: "name" })), _jsx(MobileInput, { label: "E-mail", icon: "mail", type: "email", placeholder: "seu@email.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, autoComplete: "email" }), modo === "cadastrar" && (_jsx(MobileInput, { label: "Celular", icon: "smartphone", type: "tel", placeholder: "(00) 00000-0000", value: celular, onChange: (e) => setCelular(e.target.value), required: true })), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Senha" }), modo === "entrar" && (_jsx("button", { type: "button", className: "text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline", children: "Esqueceu?" }))] }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none", children: "lock" }), _jsx("input", { type: mostrarSenha ? "text" : "password", value: senha, onChange: (e) => setSenha(e.target.value), className: "mobile-input pl-11 pr-11", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, autoComplete: modo === "entrar" ? "current-password" : "new-password" }), _jsx("button", { type: "button", onClick: () => setMostrarSenha(!mostrarSenha), className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-xl", children: mostrarSenha ? "visibility_off" : "visibility" }) })] }), modo === "cadastrar" && senha && (_jsxs("div", { className: "mt-2 space-y-1.5", children: [_jsx("div", { className: "flex gap-1 h-1", children: [1, 2, 3, 4, 5].map((i) => (_jsx("div", { className: `flex-1 rounded-full transition-all ${i <= forca ? forcaColor : "bg-slate-200 dark:bg-slate-700"}` }, i))) }), _jsxs("p", { className: "text-xs text-slate-400", children: ["Senha ", _jsx("span", { className: forcaColor.replace("bg-", "text-"), children: forcaText })] })] }))] }), modo === "cadastrar" && tipo === "aluno" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: "Sua Turma" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none", children: "school" }), _jsxs("select", { value: turmaId, onChange: (e) => setTurmaId(e.target.value), className: "mobile-input pl-11 appearance-none", required: true, children: [_jsx("option", { value: "", disabled: true, children: carregandoTurmas ? "Carregando..." : "Selecione sua turma" }), turmas.map((t) => (_jsx("option", { value: t.id, children: t.nome }, t.id)))] })] })] }), _jsx(MobileInput, { label: "Senha da Turma", icon: "key", placeholder: "Fornecida pela comiss\u00E3o", value: senhaTurma, onChange: (e) => setSenhaTurma(e.target.value), required: true })] })), error && (_jsxs("div", { className: "p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-start gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-red-500 text-lg flex-shrink-0", children: "error" }), _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error })] })), _jsx(MobileButton, { type: "submit", variant: "primary", size: "lg", fullWidth: true, loading: loading, icon: modo === "entrar" ? "login" : "person_add", className: "mt-2 rounded-2xl shadow-lg shadow-indigo-500/20", children: modo === "entrar" ? "Entrar" : "Criar minha conta" })] }), _jsxs("p", { className: "text-center text-xs text-slate-400 mt-6", children: ["Ao continuar, voc\u00EA concorda com os", " ", _jsx(Link, { to: "/termos", className: "text-indigo-600 dark:text-indigo-400 hover:underline", children: "Termos de Uso" }), " ", "e", " ", _jsx(Link, { to: "/privacidade", className: "text-indigo-600 dark:text-indigo-400 hover:underline", children: "Privacidade" })] })] })] }));
}
