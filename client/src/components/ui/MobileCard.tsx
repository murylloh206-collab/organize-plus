import React from "react";

interface MobileCardProps {
  variant?: "default" | "gradient" | "outlined";
  padding?: "sm" | "md" | "lg" | "none";
  rounded?: "lg" | "xl" | "2xl" | "3xl";
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const roundedMap = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

export default function MobileCard({
  variant = "default",
  padding = "md",
  rounded = "2xl",
  children,
  onClick,
  className = "",
}: MobileCardProps) {
  const baseClass = `${roundedMap[rounded]} ${paddingMap[padding]} ${className}`;
  const variantClass =
    variant === "gradient"
      ? "mobile-card-gradient"
      : variant === "outlined"
      ? "mobile-card-outlined"
      : "mobile-card";

  const clickClass = onClick ? "cursor-pointer active:scale-[0.985] transition-transform duration-150" : "";

  return (
    <div
      className={`${variantClass} ${baseClass} ${clickClass}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
