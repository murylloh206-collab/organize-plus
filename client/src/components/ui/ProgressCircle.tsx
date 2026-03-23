interface ProgressCircleProps {
  value: number;         // 0-100
  size?: number;         // svg size in px
  strokeWidth?: number;
  color?: string;        // tailwind color or hex
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export default function ProgressCircle({
  value,
  size = 100,
  strokeWidth = 10,
  color = "#6366f1",
  showLabel = true,
  label,
  className = "",
}: ProgressCircleProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black text-slate-900 dark:text-white leading-none"
            style={{ fontSize: size * 0.18 }}
          >
            {clamped}%
          </span>
          {label && (
            <span
              className="text-slate-400 font-medium leading-none mt-0.5"
              style={{ fontSize: size * 0.1 }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
