import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
const adminLinks = [
    { to: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
    { to: "/admin/alunos", icon: "group", label: "Alunos" },
    { to: "/admin/rifas", icon: "confirmation_number", label: "Rifas" },
    { to: "/admin/pagamentos", icon: "payments", label: "Pagamentos" },
    { to: "/admin/eventos", icon: "event", label: "Eventos" },
    { to: "/admin/ranking", icon: "emoji_events", label: "Ranking" },
    { to: "/admin/relatorios", icon: "bar_chart", label: "Relatórios" },
    { to: "/admin/configuracoes", icon: "settings", label: "Configurações" },
];
const alunoLinks = [
    { to: "/aluno/dashboard", icon: "dashboard", label: "Dashboard" },
    { to: "/aluno/rifas", icon: "confirmation_number", label: "Minhas Rifas" },
    { to: "/aluno/pagamentos", icon: "payments", label: "Pagamentos" },
    { to: "/aluno/caixa", icon: "account_balance", label: "Caixa" },
    { to: "/aluno/perfil", icon: "person", label: "Meu Perfil" },
];
export default function Sidebar({ role }) {
    const { logout } = useAuth();
    const links = role === "admin" ? adminLinks : alunoLinks;
    const portalLabel = role === "admin" ? "Admin Portal" : "Área do Aluno";
    const portalIcon = role === "admin" ? "auto_awesome_motion" : "account_balance_wallet";
    return (_jsxs("aside", { className: "w-64 bg-[#1e3a5f] text-white border-r border-[#16304f] flex flex-col fixed h-full z-20", children: [_jsxs("div", { className: "p-6 flex items-center gap-3", children: [_jsx("div", { className: "size-10 rounded-lg bg-primary flex items-center justify-center text-white shrink-0", children: _jsx("span", { className: "material-symbols-outlined", children: portalIcon }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-[17px] font-bold leading-none text-white", children: "Organizze+" }), _jsx("p", { className: "text-[10px] uppercase tracking-wider font-semibold text-white/50 mt-0.5", children: portalLabel })] })] }), _jsx("nav", { className: "flex-1 px-4 py-2 space-y-0.5", children: links.map((link) => (_jsxs(NavLink, { to: link.to, className: ({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link", children: [_jsx("span", { className: "material-symbols-outlined text-[22px]", children: link.icon }), link.label] }, link.to))) }), _jsx("div", { className: "p-4 border-t border-slate-200 dark:border-slate-800", children: _jsxs("button", { onClick: () => logout.mutate(), className: "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-medium", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "logout" }), "Sair"] }) })] }));
}
