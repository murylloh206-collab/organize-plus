// client/src/components/ui/BottomSheet.tsx
import React, { useEffect, useRef, useState } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = "75vh",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const [translateY, setTranslateY] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTranslateY(0);
    } else {
      document.body.style.overflow = "";
      setTranslateY(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = translateY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      setTranslateY(currentYRef.current + deltaY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    if (deltaY > 80) {
      onClose(); // swipe down > 80px closes
    } else {
      setTranslateY(0); // snap back
    }
    isDraggingRef.current = false;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl z-50 flex flex-col"
        style={{ 
          maxHeight,
          transform: `translateY(${translateY}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.3s ease-out'
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        {/* Content - com scroll e padding-bottom para a sidebar */}
        <div className="overflow-y-auto flex-1 px-5 py-4 pb-24">
          {children}
        </div>
      </div>
    </>
  );
}