import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function SkeletonBase({ className = "" }) {
    return _jsx("div", { className: `skeleton ${className}` });
}
export default function Skeleton({ variant = "line", className = "", lines = 3 }) {
    if (variant === "avatar") {
        return _jsx(SkeletonBase, { className: `size-10 rounded-full ${className}` });
    }
    if (variant === "metric") {
        return (_jsxs("div", { className: "mobile-card p-4 space-y-3", children: [_jsx(SkeletonBase, { className: "size-10 rounded-xl" }), _jsx(SkeletonBase, { className: "h-3 w-20" }), _jsx(SkeletonBase, { className: "h-6 w-28" })] }));
    }
    if (variant === "card") {
        return (_jsx("div", { className: "mobile-card p-4 space-y-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(SkeletonBase, { className: "size-10 rounded-full" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(SkeletonBase, { className: "h-4 w-32" }), _jsx(SkeletonBase, { className: "h-3 w-24" })] }), _jsx(SkeletonBase, { className: "h-6 w-16 rounded-full" })] }) }));
    }
    // Lines
    return (_jsx("div", { className: `space-y-2 ${className}`, children: Array.from({ length: lines }).map((_, i) => (_jsx(SkeletonBase, { className: `h-4 rounded-lg ${i === lines - 1 ? "w-3/4" : "w-full"}` }, i))) }));
}
