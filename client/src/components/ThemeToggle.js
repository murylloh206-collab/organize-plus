import { jsx as _jsx } from "react/jsx-runtime";
import { useDarkMode } from "../hooks/useDarkMode";
export default function ThemeToggle() {
    const { isDark, toggle } = useDarkMode();
    return (_jsx("button", { onClick: toggle, className: "flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors", "aria-label": "Alternar modo escuro", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: isDark ? "light_mode" : "dark_mode" }) }));
}
