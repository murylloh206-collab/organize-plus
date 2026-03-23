import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import MobileBottomNav from "./MobileBottomNav";
export default function MobileLayout({ children, role, className = "" }) {
    return (_jsxs("div", { className: `mobile-layout ${className}`, children: [_jsx("div", { className: "max-w-2xl mx-auto", children: children }), _jsx(MobileBottomNav, { role: role })] }));
}
