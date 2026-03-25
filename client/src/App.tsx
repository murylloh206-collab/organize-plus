import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import TermosPage from "./pages/termos";
import CriadorPage from "./pages/criador";
import PrivacidadePage from "./pages/privacidade";
import SuportePage from "./pages/suporte";
import AdminCaixa from "./pages/admin/caixa";


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

function RequireAuth({ children, role }: { children: React.ReactNode; role?: "admin" | "aluno" }) {
  const { auth, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!auth?.userId) return <Navigate to="/acesso" replace />;
  if (role && auth.role !== role) {
    return <Navigate to={auth.role === "admin" ? "/admin/dashboard" : "/aluno/dashboard"} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route path="/" element={<HomePage />} />
        <Route path="/acesso" element={<AcessoPage />} />
        <Route path="/cadastro" element={<AlunoCadastro />} />
        <Route path="/termos" element={<TermosPage />} />
        <Route path="/criador" element={<CriadorPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route path="/suporte" element={<SuportePage />} />

        {/* Admin (protegidas) */}
        <Route path="/admin/create-sala" element={<RequireAuth role="admin"><CreateSalaPage /></RequireAuth>} />
        <Route path="/admin/dashboard" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/alunos" element={<RequireAuth role="admin"><AdminAlunos /></RequireAuth>} />
        <Route path="/admin/rifas" element={<RequireAuth role="admin"><AdminRifas /></RequireAuth>} />
        <Route path="/admin/pagamentos" element={<RequireAuth role="admin"><AdminPagamentos /></RequireAuth>} />
        <Route path="/admin/eventos" element={<RequireAuth role="admin"><AdminEventos /></RequireAuth>} />
        <Route path="/admin/metas" element={<RequireAuth role="admin"><AdminMetas /></RequireAuth>} /> 
        <Route path="/admin/metas/:id" element={<RequireAuth role="admin"><AdminMetas /></RequireAuth>} /> 
        <Route path="/admin/ranking" element={<RequireAuth role="admin"><AdminRanking /></RequireAuth>} />
        <Route path="/admin/relatorios" element={<RequireAuth role="admin"><AdminRelatorios /></RequireAuth>} />
        <Route path="/admin/configuracoes" element={<RequireAuth role="admin"><AdminConfiguracoes /></RequireAuth>} />
        <Route path="/admin/caixa" element={<RequireAuth role="admin"><AdminCaixa /></RequireAuth>} />


        {/* Aluno */}
        <Route path="/aluno/dashboard" element={<RequireAuth role="aluno"><AlunoDashboard /></RequireAuth>} />
        <Route path="/aluno/rifas" element={<RequireAuth role="aluno"><AlunoRifas /></RequireAuth>} />
        <Route path="/aluno/pagamentos" element={<RequireAuth role="aluno"><AlunoPagamentos /></RequireAuth>} />
        <Route path="/aluno/caixa" element={<RequireAuth role="aluno"><AlunoCaixa /></RequireAuth>} />
        <Route path="/aluno/perfil" element={<RequireAuth role="aluno"><AlunoPerfil /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}