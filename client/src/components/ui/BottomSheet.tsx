import React, { useEffect, useRef } from "react";

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
  maxHeight = "90vh",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

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
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Touch drag to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    if (deltaY > 80) onClose(); // swipe down > 80px closes
    isDraggingRef.current = false;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="bottom-sheet-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={sheetRef}
        className="bottom-sheet-panel"
        style={{ maxHeight }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
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

        {/* Content */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </>
  );
}
