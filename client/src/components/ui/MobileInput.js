import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
const MobileInput = forwardRef(({ label, icon, iconRight, error, hint, onIconRightClick, containerClassName = "", className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (_jsxs("div", { className: `space-y-1.5 ${containerClassName}`, children: [label && (_jsx("label", { htmlFor: inputId, className: "block text-sm font-semibold text-slate-700 dark:text-slate-300", children: label })), _jsxs("div", { className: "relative", children: [icon && (_jsx("span", { className: "material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl pointer-events-none", children: icon })), _jsx("input", { ref: ref, id: inputId, className: `
              mobile-input
              ${icon ? "pl-11" : ""}
              ${iconRight ? "pr-11" : ""}
              ${error ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/30" : ""}
              ${className}
            `, ...props }), iconRight && (_jsx("button", { type: "button", onClick: onIconRightClick, className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-xl", children: iconRight }) }))] }), error && (_jsxs("p", { className: "text-xs text-red-500 flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "error" }), error] })), hint && !error && (_jsx("p", { className: "text-xs text-slate-400", children: hint }))] }));
});
MobileInput.displayName = "MobileInput";
export default MobileInput;
