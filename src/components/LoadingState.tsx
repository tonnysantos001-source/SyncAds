import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TIPOS
// ============================================================================

export type LoadingType = "spinner" | "skeleton" | "progress" | "dots" | "pulse";

export interface LoadingStateProps {
  type?: LoadingType;
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  className?: string;
  progress?: number; // 0-100 para type="progress"
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function LoadingState({
  type = "spinner",
  message,
  size = "md",
  fullScreen = false,
  className,
  progress,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-3",
    fullScreen && "min-h-screen fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
    !fullScreen && "py-8",
    className
  );

  return (
    <div className={containerClasses}>
      {/* Renderizar tipo de loading */}
      {type === "spinner" && <SpinnerLoading size={sizeClasses[size]} />}
      {type === "skeleton" && <SkeletonLoading />}
      {type === "progress" && <ProgressLoading progress={progress || 0} />}
      {type === "dots" && <DotsLoading size={size} />}
      {type === "pulse" && <PulseLoading size={sizeClasses[size]} />}

      {/* Mensagem */}
      {message && (
        <p className="text-sm text-muted-foreground text-center max-w-md animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// VARIAÇÕES DE LOADING
// ============================================================================

function SpinnerLoading({ size }: { size: string }) {
  return (
    <Loader2
      className={cn(size, "animate-spin text-primary")}
      strokeWidth={2.5}
    />
  );
}

function SkeletonLoading() {
  return (
    <div className="w-full max-w-md space-y-3">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
      <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
    </div>
  );
}

function ProgressLoading({ progress }: { progress: number }) {
  return (
    <div className="w-full max-w-md space-y-2">
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-xs text-center text-muted-foreground">
        {Math.round(progress)}%
      </p>
    </div>
  );
}

function DotsLoading({ size }: { size: "sm" | "md" | "lg" | "xl" }) {
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const dotClass = cn(dotSizes[size], "bg-primary rounded-full");

  return (
    <div className="flex items-center gap-2">
      <div className={cn(dotClass, "animate-bounce [animation-delay:-0.3s]")} />
      <div className={cn(dotClass, "animate-bounce [animation-delay:-0.15s]")} />
      <div className={cn(dotClass, "animate-bounce")} />
    </div>
  );
}

function PulseLoading({ size }: { size: string }) {
  return (
    <div className={cn(size, "relative")}>
      {/* Anel externo */}
      <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
      {/* Anel interno */}
      <div className="absolute inset-2 rounded-full bg-primary/40 animate-pulse" />
      {/* Centro */}
      <div className="absolute inset-4 rounded-full bg-primary" />
    </div>
  );
}

// ============================================================================
// COMPONENTES ESPECÍFICOS
// ============================================================================

export function PageLoading({ message }: { message?: string }) {
  return (
    <LoadingState
      type="spinner"
      size="lg"
      fullScreen
      message={message || "Carregando..."}
    />
  );
}

export function CardLoading() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
      <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
    </div>
  );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse flex-1" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          {[...Array(4)].map((_, j) => (
            <div
              key={j}
              className="h-4 bg-muted rounded animate-pulse flex-1"
              style={{ animationDelay: `${(i + j) * 0.05}s` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ButtonLoading() {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Carregando...</span>
    </div>
  );
}

export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      {message && <span>{message}</span>}
    </div>
  );
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="w-10 h-10 bg-muted rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
          </div>
          <div className="w-20 h-8 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 p-4 border-b flex gap-4">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse flex-1" />
        ))}
      </div>
      {/* Body */}
      <div className="divide-y">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            {[...Array(cols)].map((_, j) => (
              <div
                key={j}
                className="h-4 bg-muted rounded animate-pulse flex-1"
                style={{ animationDelay: `${(i + j) * 0.05}s` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LoadingState;
