import { useNavigate } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: Array<{ icon: string; onClick: () => void; label?: string }>;
  className?: string;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  actions = [],
  className = "",
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={`bg-gradient-to-r from-[#1e3a5f] to-[#0f2a44] border-b border-[#c6a43f]/20 sticky top-0 z-10 ${className}`}>
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Lado esquerdo */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-white text-2xl">
                arrow_back
              </span>
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

        {/* Lado direito */}
        <div className="flex items-center gap-2">
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

      {/* Linha decorativa dourada */}
      <div className="h-0.5 bg-gradient-to-r from-[#c6a43f] via-[#d4b254] to-[#c6a43f] opacity-50" />
    </header>
  );
}