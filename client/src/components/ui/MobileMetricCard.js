import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const colorMap = {
    primary: {
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        icon: "text-indigo-600 dark:text-indigo-400",
        text: "text-indigo-600 dark:text-indigo-400",
    },
    green: {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        icon: "text-emerald-600 dark:text-emerald-400",
        text: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        icon: "text-amber-600 dark:text-amber-400",
        text: "text-amber-600 dark:text-amber-400",
    },
    blue: {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        icon: "text-blue-600 dark:text-blue-400",
        text: "text-blue-600 dark:text-blue-400",
    },
    purple: {
        bg: "bg-purple-50 dark:bg-purple-950/40",
        icon: "text-purple-600 dark:text-purple-400",
        text: "text-purple-600 dark:text-purple-400",
    },
    rose: {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        icon: "text-rose-600 dark:text-rose-400",
        text: "text-rose-600 dark:text-rose-400",
    },
};
export default function MobileMetricCard({ title, value, icon, trend, color = "primary", subtitle, loading = false, }) {
    const colors = colorMap[color] || colorMap.primary;
    if (loading) {
        return (_jsxs("div", { className: "mobile-card p-4", children: [_jsx("div", { className: "skeleton h-10 w-10 rounded-xl mb-3" }), _jsx("div", { className: "skeleton h-4 w-16 mb-2" }), _jsx("div", { className: "skeleton h-6 w-24" })] }));
    }
    return (_jsxs("div", { className: "mobile-card p-4 hover-elevate", children: [_jsx("div", { className: `inline-flex p-2.5 rounded-xl ${colors.bg} mb-3`, children: _jsx("span", { className: `material-symbols-outlined text-xl ${colors.icon}`, children: icon }) }), _jsx("p", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide", children: title }), _jsx("p", { className: "text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight", children: value }), (subtitle || trend) && (_jsxs("div", { className: "mt-2 flex items-center gap-1", children: [trend && (_jsxs("span", { className: `text-xs font-bold flex items-center gap-0.5 ${trend.direction === "up"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-500"}`, children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: trend.direction === "up" ? "trending_up" : "trending_down" }), trend.direction === "up" ? "+" : "-", trend.value, "%"] })), subtitle && (_jsx("span", { className: "text-xs text-slate-400", children: subtitle }))] }))] }));
}
