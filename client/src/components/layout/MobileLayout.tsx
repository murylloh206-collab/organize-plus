import React from "react";
import MobileBottomNav from "./MobileBottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  role: "admin" | "aluno";
  className?: string;
}

export default function MobileLayout({ children, role, className = "" }: MobileLayoutProps) {
  return (
    <div className={`mobile-layout ${className}`}>
      <div className="max-w-2xl mx-auto">
        {children}
      </div>
      <MobileBottomNav role={role} />
    </div>
  );
}
