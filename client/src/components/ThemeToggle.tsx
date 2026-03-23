import { useDarkMode } from "../hooks/useDarkMode";

interface ThemeToggleProps {
  variant?: "default" | "gradient" | "gold";
}

export default function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { isDark, toggle } = useDarkMode();

  const getClassName = () => {
    if (variant === "gradient") return "theme-toggle-gradient";
    if (variant === "gold") return "theme-toggle-gold";
    return "theme-toggle";
  };

  return (
    <button
      onClick={toggle}
      className={getClassName()}
      aria-label="Alternar modo escuro"
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}