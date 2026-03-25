import React from "react";

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold"; // ← removi "success"
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantClasses = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
  danger: "bg-danger text-white hover:bg-danger-dark",
  ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
  gold: "bg-[#b89430] hover:bg-[#9a7a28] text-[#1e3a5f] font-bold",
};

const sizeMap: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs gap-1",
  md: "px-4 py-2 text-sm gap-1.5",
  lg: "px-5 py-2.5 text-base gap-2",
};

export default function MobileButton({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: MobileButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none";
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeMap[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[18px]">{iconRight}</span>
      )}
    </button>
  );
}