import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import TermosPage from "./pages/termos";
import CriadorPage from "./pages/criador";
import PrivacidadePage from "./pages/privacidade";
import SuportePage from "./pages/suporte";
// Pages
import HomePage from "./pages/home";
import AcessoPage from "./pages/acesso";
// Admin
import AdminDashboard from "./pages/admin/dashboard";
import AdminAlunos from "./pages/admin/alunos";
import AdminRifas from "./pages/admin/rifas";
import AdminPagamentos from "./pages/admin/pagamentos";
import AdminEventos from "./pages/admin/eventos";
import AdminMetas from "./pages/admin/metas";
import AdminRanking from "./pages/admin/ranking";
import AdminRelatorios from "./pages/admin/relatorios";
import AdminConfiguracoes from "./pages/admin/configuracoes";
import CreateSalaPage from "./pages/admin/create-sala";
// Aluno
import AlunoDashboard from "./pages/aluno/dashboard";
import AlunoRifas from "./pages/aluno/rifas";
import AlunoPagamentos from "./pages/aluno/pagamentos";
import AlunoCaixa from "./pages/aluno/caixa";
import AlunoPerfil from "./pages/aluno/perfil";
import AlunoCadastro from "./pages/aluno/cadastro";
function RequireAuth({ children, role }) {
    const { auth, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "text-slate-400 font-medium", children: "Carregando..." })] }) }));
    }
    if (!auth?.userId)
        return _jsx(Navigate, { to: "/acesso", replace: true });
    if (role && auth.role !== role) {
        return _jsx(Navigate, { to: auth.role === "admin" ? "/admin/dashboard" : "/aluno/dashboard", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/acesso", element: _jsx(AcessoPage, {}) }), _jsx(Route, { path: "/cadastro", element: _jsx(AlunoCadastro, {}) }), _jsx(Route, { path: "/termos", element: _jsx(TermosPage, {}) }), _jsx(Route, { path: "/criador", element: _jsx(CriadorPage, {}) }), _jsx(Route, { path: "/privacidade", element: _jsx(PrivacidadePage, {}) }), _jsx(Route, { path: "/suporte", element: _jsx(SuportePage, {}) }), _jsx(Route, { path: "/admin/create-sala", element: _jsx(RequireAuth, { role: "admin", children: _jsx(CreateSalaPage, {}) }) }), _jsx(Route, { path: "/admin/dashboard", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminDashboard, {}) }) }), _jsx(Route, { path: "/admin/alunos", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminAlunos, {}) }) }), _jsx(Route, { path: "/admin/rifas", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminRifas, {}) }) }), _jsx(Route, { path: "/admin/pagamentos", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminPagamentos, {}) }) }), _jsx(Route, { path: "/admin/eventos", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminEventos, {}) }) }), _jsx(Route, { path: "/admin/metas", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminMetas, {}) }) }), _jsx(Route, { path: "/admin/metas/:id", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminMetas, {}) }) }), _jsx(Route, { path: "/admin/ranking", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminRanking, {}) }) }), _jsx(Route, { path: "/admin/relatorios", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminRelatorios, {}) }) }), _jsx(Route, { path: "/admin/configuracoes", element: _jsx(RequireAuth, { role: "admin", children: _jsx(AdminConfiguracoes, {}) }) }), _jsx(Route, { path: "/aluno/dashboard", element: _jsx(RequireAuth, { role: "aluno", children: _jsx(AlunoDashboard, {}) }) }), _jsx(Route, { path: "/aluno/rifas", element: _jsx(RequireAuth, { role: "aluno", children: _jsx(AlunoRifas, {}) }) }), _jsx(Route, { path: "/aluno/pagamentos", element: _jsx(RequireAuth, { role: "aluno", children: _jsx(AlunoPagamentos, {}) }) }), _jsx(Route, { path: "/aluno/caixa", element: _jsx(RequireAuth, { role: "aluno", children: _jsx(AlunoCaixa, {}) }) }), _jsx(Route, { path: "/aluno/perfil", element: _jsx(RequireAuth, { role: "aluno", children: _jsx(AlunoPerfil, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
