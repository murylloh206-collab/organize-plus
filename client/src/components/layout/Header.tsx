import { useDarkMode } from "../../hooks/useDarkMode";

interface HeaderProps {
  title: string;
  userName?: string;
}

export default function Header({ title, userName }: HeaderProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
      <h2 className="text-lg font-bold">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Alternar modo escuro"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
        </button>

        {/* User */}
        {userName && (
          <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold hidden sm:block">{userName}</span>
          </div>
        )}
      </div>
    </header>
  );
}
