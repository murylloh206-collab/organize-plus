import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "../../components/ThemeToggle";
export default function AlunoCadastro() {
    const { registerAluno } = useAuth();
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [salaId, setSalaId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
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
    async function handleRegister() {
        setError("");
        setLoading(true);
        try {
            await registerAluno.mutateAsync({
                nome, email, senha, salaId
            });
            navigate("/aluno/dashboard");
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute top-6 right-6", children: _jsx(ThemeToggle, {}) }), _jsxs("div", { className: "w-full max-w-md animate-fade-in card p-8 space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto size-14 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-full flex items-center justify-center mb-4", children: _jsx("span", { className: "material-symbols-outlined text-3xl", children: "school" }) }), _jsx("h2", { className: "text-2xl font-black", children: "Cadastro de Aluno" }), _jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Crie sua conta para acompanhar sua turma." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold block mb-1", children: "Nome Completo" }), _jsx("input", { className: "input", placeholder: "Jo\u00E3o Silva", value: nome, onChange: e => setNome(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold block mb-1", children: "E-mail" }), _jsx("input", { className: "input", type: "email", placeholder: "jao@email.com", value: email, onChange: e => setEmail(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold block mb-1", children: "ID da Turma" }), _jsx("input", { className: "input", placeholder: "Ex: 5", value: salaId, onChange: e => setSalaId(e.target.value) }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Solicite o ID num\u00E9rico da turma ao admin." })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold block mb-1", children: "Senha" }), _jsx("input", { className: "input", type: "password", placeholder: "M\u00EDnimo 8 caracteres", value: senha, onChange: e => setSenha(e.target.value) }), _jsx("div", { className: "flex gap-1 h-1.5 mt-2", children: [1, 2, 3, 4, 5].map(i => (_jsx("div", { className: `flex-1 rounded-full transition-all duration-300 ${i <= forca ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}` }, i))) })] }), error && _jsx("p", { className: "text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg", children: error }), _jsx("button", { onClick: handleRegister, disabled: loading || !nome || !email || !senha || !salaId, className: "btn-primary w-full py-3 mt-2", children: loading ? "Criando conta..." : "Completar Cadastro" }), _jsxs("p", { className: "text-center text-sm text-slate-500 font-medium", children: ["J\u00E1 tem uma conta? ", _jsx(Link, { to: "/acesso", className: "text-primary hover:underline", children: "Fa\u00E7a login" })] })] })] })] }));
}
