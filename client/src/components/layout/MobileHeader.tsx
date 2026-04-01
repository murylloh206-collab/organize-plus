import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ThemeToggle from "../ThemeToggle";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../lib/queryClient";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showAvatar?: boolean;
  actions?: Array<{ icon: string; onClick: () => void; label?: string }>;
  gradient?: boolean;
  gold?: boolean;
  className?: string;
}

function getInitials(nome?: string): string {
  if (!nome) return "?";
  const parts = nome.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  showAvatar = false,
  actions = [],
  gradient = false,
  gold = false,
  className = "",
}: MobileHeaderProps) {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const { data: me } = useQuery<any>({
    queryKey: ["me"],
    queryFn: () => apiRequest("GET", "/alunos/me"),
    enabled: showAvatar && !!auth,
    staleTime: 60_000,
  });

  const avatarElement = showAvatar && auth ? (
    <Link to="/aluno/perfil" className="shrink-0">
      {me?.avatarUrl ? (
        <img
          src={me.avatarUrl}
          alt={me?.nome || "Avatar"}
          className="size-9 rounded-full object-cover border-2 border-white/30 hover:border-white/60 transition-colors"
        />
      ) : (
        <div className="size-9 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 hover:border-white/60 transition-colors">
          <span className="text-xs font-bold text-white">
            {getInitials(me?.nome)}
          </span>
        </div>
      )}
    </Link>
  ) : null;

  // Estilo gradient
  if (gradient) {
    return (
      <header className={`sticky top-0 z-10 ${className}`}>
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0f2a44] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white leading-tight tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-white/70 font-medium mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {avatarElement}
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                aria-label={action.label}
                className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors text-white"
              >
                <span className="material-symbols-outlined text-xl">{action.icon}</span>
              </button>
            ))}
            <ThemeToggle />
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-[#c6a43f] via-[#d4b254] to-[#c6a43f] opacity-50" />
      </header>
    );
  }

  // Estilo gold
  if (gold) {
    return (
      <header className={`sticky top-0 z-10 ${className}`}>
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0f2a44] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white leading-tight tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-white/70 font-medium mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {avatarElement}
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                aria-label={action.label}
                className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors text-white"
              >
                <span className="material-symbols-outlined text-xl">{action.icon}</span>
              </button>
            ))}
            <ThemeToggle />
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-[#c6a43f] via-[#d4b254] to-[#c6a43f] opacity-50" />
      </header>
    );
  }

  // Estilo padrão
  return (
    <header className={`sticky top-0 z-10 ${className}`}>
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0f2a44] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-white/70 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {avatarElement}
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              aria-label={action.label}
              className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors text-white"
            >
              <span className="material-symbols-outlined text-xl">{action.icon}</span>
            </button>
          ))}
          <ThemeToggle />
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-[#c6a43f] via-[#d4b254] to-[#c6a43f] opacity-50" />
    </header>
  );
}
