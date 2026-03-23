import { jsx as _jsx } from "react/jsx-runtime";
const sizeMap = {
    xs: "size-6 text-xs",
    sm: "size-8 text-sm",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
    xl: "size-16 text-xl",
};
const colorMap = {
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};
const colorList = ["indigo", "emerald", "amber", "blue", "purple", "rose"];
function getColorFromName(name) {
    if (!name)
        return colorMap.indigo;
    const idx = name.charCodeAt(0) % colorList.length;
    return colorMap[colorList[idx]];
}
export default function MobileAvatar({ name, src, size = "md", color, className = "" }) {
    const sizeClass = sizeMap[size];
    const colorClass = color ? colorMap[color] : getColorFromName(name);
    const initial = name?.charAt(0).toUpperCase() || "?";
    if (src) {
        return (_jsx("img", { src: src, alt: name || "Avatar", className: `${sizeClass} rounded-full object-cover flex-shrink-0 ${className}` }));
    }
    return (_jsx("div", { className: `${sizeClass} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${colorClass} ${className}`, children: initial }));
}
