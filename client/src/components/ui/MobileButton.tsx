// client/src/components/ui/MobileButton.tsx
import React from "react";

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantMap: Record<string, string> = {
  primary: "btn-mobile-primary",
  secondary: "btn-mobile-secondary",
  ghost: "btn-mobile-ghost",
  danger: "btn-mobile-danger",
  success: "btn-mobile-primary", 
};

const sizeMap: Record<string, string> = {
  sm: "btn-mobile-sm",
  md: "btn-mobile-md",
  lg: "btn-mobile-lg",
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
  return (
    <button
      className={`
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-60 pointer-events-none" : ""}
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