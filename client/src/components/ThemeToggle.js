import { jsx as _jsx } from "react/jsx-runtime";
import { useDarkMode } from "../hooks/useDarkMode";
export default function ThemeToggle({ variant = "default" }) {
    const { isDark, toggle } = useDarkMode();
    const getClassName = () => {
        if (variant === "gradient")
            return "theme-toggle-gradient";
        if (variant === "gold")
            return "theme-toggle-gold";
        return "theme-toggle";
    };
    return (_jsx("button", { onClick: toggle, className: getClassName(), "aria-label": "Alternar modo escuro", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: isDark ? "light_mode" : "dark_mode" }) }));
}
