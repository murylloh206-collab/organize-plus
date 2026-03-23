import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const variantMap = {
    primary: "btn-mobile-primary",
    secondary: "btn-mobile-secondary",
    ghost: "btn-mobile-ghost",
    danger: "btn-mobile-danger",
    success: "btn-mobile-primary",
};
const sizeMap = {
    sm: "btn-mobile-sm",
    md: "btn-mobile-md",
    lg: "btn-mobile-lg",
};
export default function MobileButton({ variant = "primary", size = "md", icon, iconRight, loading = false, fullWidth = false, children, className = "", disabled, ...props }) {
    return (_jsxs("button", { className: `
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-60 pointer-events-none" : ""}
        ${className}
      `, disabled: disabled || loading, ...props, children: [loading ? (_jsx("span", { className: "size-4 border-2 border-current border-t-transparent rounded-full animate-spin" })) : icon ? (_jsx("span", { className: "material-symbols-outlined text-[18px]", children: icon })) : null, children, iconRight && !loading && (_jsx("span", { className: "material-symbols-outlined text-[18px]", children: iconRight }))] }));
}
