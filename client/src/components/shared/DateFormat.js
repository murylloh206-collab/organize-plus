import { jsx as _jsx } from "react/jsx-runtime";
export function formatDate(date, format = "short") {
    if (!date)
        return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime()))
        return "—";
    if (format === "relative") {
        const diff = Date.now() - d.getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0)
            return "Hoje";
        if (days === 1)
            return "Ontem";
        if (days < 7)
            return `${days} dias atrás`;
        if (days < 30)
            return `${Math.floor(days / 7)} sem. atrás`;
        return d.toLocaleDateString("pt-BR");
    }
    if (format === "long") {
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    }
    return d.toLocaleDateString("pt-BR");
}
export default function DateFormat({ date, format = "short", className = "" }) {
    return _jsx("span", { className: className, children: formatDate(date, format) });
}
