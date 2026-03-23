import { jsx as _jsx } from "react/jsx-runtime";
export function formatCurrency(value) {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num))
        return "R$ 0,00";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export default function CurrencyFormat({ value, className = "" }) {
    return _jsx("span", { className: className, children: formatCurrency(value) });
}
