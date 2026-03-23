import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const variantConfig = {
    success: { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", dot: "bg-emerald-500" },
    warning: { className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", dot: "bg-amber-500" },
    danger: { className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400", dot: "bg-red-500" },
    info: { className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400", dot: "bg-blue-500" },
    neutral: { className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
    primary: { className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400", dot: "bg-indigo-500" },
    gold: { className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", dot: "bg-amber-500" },
};
const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
};
export default function MobileBadge({ variant = "neutral", size = "sm", icon, showDot = false, className = "", children }) {
    const config = variantConfig[variant] || variantConfig.neutral;
    return (_jsxs("span", { className: `inline-flex items-center gap-1 rounded-full font-semibold ${config.className} ${sizeClasses[size]} ${className}`, children: [showDot && (_jsx("span", { className: `size-1.5 rounded-full ${config.dot} flex-shrink-0` })), icon && (_jsx("span", { className: "material-symbols-outlined text-[14px]", children: icon })), children] }));
}
