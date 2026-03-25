import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  role: "admin" | "aluno";
}

const adminLinks = [
  { to: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/admin/alunos", icon: "group", label: "Alunos" },
  { to: "/admin/rifas", icon: "confirmation_number", label: "Rifas" },
  { to: "/admin/pagamentos", icon: "payments", label: "Pagamentos" },
  { to: "/admin/eventos", icon: "event", label: "Eventos" },
  { to: "/admin/metas", icon: "stars", label: "Metas" },
  { to: "/admin/ranking", icon: "emoji_events", label: "Ranking" },
  { to: "/admin/caixa", icon: "account_balance_wallet", label: "Caixa" },
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

export default function Sidebar({ role }: SidebarProps) {
  const { logout, auth } = useAuth();
  const navigate = useNavigate();
  const links = role === "admin" ? adminLinks : alunoLinks;
  const portalLabel = role === "admin" ? "Admin Portal" : "Área do Aluno";

  // Foto do usuário (padrão)
  const userPhotoUrl = "https://www.shutterstock.com/image-vector/graduation-hat-cap-icon-fotion-600nw-1450808255.jpg";

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      // O logout já redireciona para "/" no mutation
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Como não temos nome/email no auth, usamos um texto padrão baseado no role
  const userName = role === "admin" ? "Administrador" : "Aluno";
  const userEmail = auth?.userId ? `ID: ${auth.userId}` : "";

  return (
    <aside className="w-64 bg-[#1e3a5f] text-white border-r border-[#16304f] flex flex-col fixed h-full z-20">
      {/* Logo e Perfil */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        {/* Foto do usuário */}
        <img 
          src={userPhotoUrl} 
          alt="Foto de perfil"
          className="size-10 rounded-lg object-cover shrink-0 border-2 border-[#c6a43f]"
        />
        <div>
          <h1 className="text-xl font-bold leading-none text-white">Organize+</h1>
          <p className="text-xs uppercase tracking-wider font-semibold text-white/50 mt-1">
            {portalLabel}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => {
              const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium";
              return isActive
                ? `${baseClasses} bg-[#c6a43f] text-[#1e3a5f] shadow-sm`
                : `${baseClasses} text-white/80 hover:bg-white/10 hover:text-white`;
            }}
          >
            <span className="material-symbols-outlined text-xl">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 text-sm font-medium"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}