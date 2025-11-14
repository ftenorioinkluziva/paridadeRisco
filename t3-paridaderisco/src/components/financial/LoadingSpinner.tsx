import * as React from "react"
import { cn } from "~/lib/utils"

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-b-2 border-blue-400",
          sizeStyles[size]
        )}
        role="status"
        aria-label={text ?? "Carregando"}
      >
        <span className="sr-only">{text ?? "Carregando..."}</span>
      </div>
      {text && <p className="dark:text-slate-400 text-slate-600 text-sm">{text}</p>}
    </div>
  )
}

export interface LoadingCardProps {
  text?: string
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ text, className }) => {
  return (
    <div
      className={cn(
        "glass-card border border-slate-700 rounded-lg p-8 text-center",
        className
      )}
    >
      <LoadingSpinner size="lg" text={text ?? "Carregando dados..."} />
    </div>
  )
}
