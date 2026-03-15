import { useDarkMode } from "../hooks/useDarkMode";

export default function ThemeToggle() {
  const { isDark, toggle } = useDarkMode();
  return (
    <button
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      aria-label="Alternar modo escuro"
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
