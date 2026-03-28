import { useEffect, useState } from "react";

interface GlobalLoadingProps {
  isLoading: boolean;
}

export default function GlobalLoading({ isLoading }: GlobalLoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="relative">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl shadow-2xl flex items-center justify-center">
          <img 
            src="/formatura-logo.png"
            alt="Loading" 
            className="w-25 h-25 object-contain"
          />
        </div>
        
        {/* Anel dourado girando - CENTRALIZADO */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-full h-full animate-spin" 
            viewBox="0 0 100 100"
            style={{ animationDuration: "1.2s" }}
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#c6a43f"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="200"
              strokeDashoffset="50"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}