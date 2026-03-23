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

  if (gradient) {
    return (
      <header className={`mobile-header-gradient ${className}`}>
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-indigo-200 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              aria-label={action.label}
              className="p-2 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-white text-xl">{action.icon}</span>
            </button>
          ))}
          <ThemeToggle />
        </div>
      </header>
    );
  }

  if (gold) {
    return (
      <header className={`mobile-header-gold ${className}`}>
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-amber-100 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              aria-label={action.label}
              className="p-2 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-white text-xl">{action.icon}</span>
            </button>
          ))}
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className={`mobile-header ${className}`}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">
              arrow_back
            </span>
          </button>
        )}
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            aria-label={action.label}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
          >
            <span className="material-symbols-outlined text-xl">{action.icon}</span>
          </button>
        ))}
        <ThemeToggle />
      </div>
    </header>
  );
}