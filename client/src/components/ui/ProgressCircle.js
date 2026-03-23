import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ProgressCircle({ value, size = 100, strokeWidth = 10, color = "#6366f1", showLabel = true, label, className = "", }) {
    const clamped = Math.min(100, Math.max(0, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - clamped / 100);
    const center = size / 2;
    return (_jsxs("div", { className: `relative inline-flex items-center justify-center ${className}`, style: { width: size, height: size }, children: [_jsxs("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: "transform -rotate-90", children: [_jsx("circle", { cx: center, cy: center, r: radius, fill: "none", stroke: "currentColor", strokeWidth: strokeWidth, className: "text-slate-100 dark:text-slate-800" }), _jsx("circle", { cx: center, cy: center, r: radius, fill: "none", stroke: color, strokeWidth: strokeWidth, strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: "round", style: { transition: "stroke-dashoffset 0.6s ease" } })] }), showLabel && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsxs("span", { className: "font-black text-slate-900 dark:text-white leading-none", style: { fontSize: size * 0.18 }, children: [clamped, "%"] }), label && (_jsx("span", { className: "text-slate-400 font-medium leading-none mt-0.5", style: { fontSize: size * 0.1 }, children: label }))] }))] }));
}
