import { useNavigate } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: Array<{ icon: string; onClick: () => void; label?: string }>;
  gradient?: boolean;
  gold?: boolean;
  className?: string;
}

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  actions = [],
  gradient = false,
  gold = false,
  className = "",
}: MobileHeaderProps) {
  const navigate = useNavigate();

  // Estilo gradient (azul escuro)
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

  // Estilo gold (também azul escuro agora)
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

  // Estilo padrão (também azul escuro)
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