import React, { forwardRef } from "react";

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  iconRight?: string;
  error?: string;
  hint?: string;
  onIconRightClick?: () => void;
  containerClassName?: string;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  (
    {
      label,
      icon,
      iconRight,
      error,
      hint,
      onIconRightClick,
      containerClassName = "",
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              mobile-input
              ${icon ? "pl-11" : ""}
              ${iconRight ? "pr-11" : ""}
              ${error ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/30" : ""}
              ${className}
            `}
            {...props}
          />
          {iconRight && (
            <button
              type="button"
              onClick={onIconRightClick}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">{iconRight}</span>
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-400">{hint}</p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = "MobileInput";
export default MobileInput;
