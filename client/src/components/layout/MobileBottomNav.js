import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
const adminItems = [
    { to: "/admin/dashboard", icon: "home", label: "Início" },
    { to: "/admin/alunos", icon: "group", label: "Alunos" },
    { to: "/admin/rifas", icon: "confirmation_number", label: "Rifas" },
    { to: "/admin/pagamentos", icon: "payments", label: "Pagamentos" },
    { to: "/admin/eventos", icon: "event", label: "Eventos" },
    { to: "/admin/ranking", icon: "leaderboard", label: "Ranking" },
    { to: "/admin/configuracoes", icon: "settings", label: "Mais" },
];
const alunoItems = [
    { to: "/aluno/dashboard", icon: "home", label: "Início" },
    { to: "/aluno/rifas", icon: "confirmation_number", label: "Rifas" },
    { to: "/aluno/pagamentos", icon: "payments", label: "Pagamentos" },
    { to: "/aluno/eventos", icon: "event", label: "Eventos" },
    { to: "/aluno/ranking", icon: "leaderboard", label: "Ranking" },
    { to: "/aluno/perfil", icon: "person", label: "Perfil" },
];
export default function MobileBottomNav({ role }) {
    const items = role === "admin" ? adminItems : alunoItems;
    return (_jsx("nav", { className: "bottom-nav", role: "navigation", "aria-label": "Navega\u00E7\u00E3o principal", children: items.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`, "aria-label": item.label, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx("span", { className: `material-symbols-outlined text-[22px] transition-all duration-200 ${isActive ? "material-symbols-filled" : ""}`, style: {
                            fontVariationSettings: isActive
                                ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24"
                                : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                        }, children: item.icon }), _jsx("span", { className: `text-[10px] font-semibold ${isActive ? "" : "opacity-60"}`, children: item.label }), isActive && (_jsx("span", { className: "absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary dark:bg-primary rounded-full" }))] })) }, item.to))) }));
}
