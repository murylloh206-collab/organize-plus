import { jsx as _jsx } from "react/jsx-runtime";
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
export default function MobileCard({ variant = "default", padding = "md", rounded = "2xl", children, onClick, className = "", }) {
    const baseClass = `${roundedMap[rounded]} ${paddingMap[padding]} ${className}`;
    const variantClass = variant === "gradient"
        ? "mobile-card-gradient"
        : variant === "outlined"
            ? "mobile-card-outlined"
            : "mobile-card";
    const clickClass = onClick ? "cursor-pointer active:scale-[0.985] transition-transform duration-150" : "";
    return (_jsx("div", { className: `${variantClass} ${baseClass} ${clickClass}`, onClick: onClick, children: children }));
}
