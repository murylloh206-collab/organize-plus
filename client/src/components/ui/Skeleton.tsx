interface SkeletonProps {
  variant?: "line" | "card" | "avatar" | "metric";
  className?: string;
  lines?: number;
}

function SkeletonBase({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function Skeleton({ variant = "line", className = "", lines = 3 }: SkeletonProps) {
  if (variant === "avatar") {
    return <SkeletonBase className={`size-10 rounded-full ${className}`} />;
  }

  if (variant === "metric") {
    return (
      <div className="mobile-card p-4 space-y-3">
        <SkeletonBase className="size-10 rounded-xl" />
        <SkeletonBase className="h-3 w-20" />
        <SkeletonBase className="h-6 w-28" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="mobile-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <SkeletonBase className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBase className="h-4 w-32" />
            <SkeletonBase className="h-3 w-24" />
          </div>
          <SkeletonBase className="h-6 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  // Lines
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          className={`h-4 rounded-lg ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}
