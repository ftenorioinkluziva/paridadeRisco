import * as React from "react"
import { cn } from "~/lib/utils"

export interface StatCardProps {
  label: string
  value: string | React.ReactNode
  info?: string
  variant?: "default" | "success" | "error" | "warning" | "info"
  className?: string
}

const variantStyles = {
  default: "dark:bg-slate-800/30 bg-slate-50 dark:border-slate-700 border-slate-200",
  success: "dark:bg-green-900/20 bg-green-50 dark:border-green-700 border-green-300",
  error: "dark:bg-red-900/20 bg-red-50 dark:border-red-700 border-red-300",
  warning: "dark:bg-yellow-900/20 bg-yellow-50 dark:border-yellow-700 border-yellow-300",
  info: "dark:bg-blue-900/20 bg-blue-50 dark:border-blue-700 border-blue-300",
}

const variantTextStyles = {
  default: "dark:text-slate-300 text-slate-700",
  success: "dark:text-green-400 text-green-700",
  error: "dark:text-red-400 text-red-700",
  warning: "dark:text-yellow-400 text-yellow-700",
  info: "dark:text-blue-400 text-blue-700",
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  info,
  variant = "default",
  className,
}) => {
  return (
    <div
      className={cn(
        "p-2 sm:p-3 rounded border transition-default hover-grow",
        variantStyles[variant],
        className
      )}
    >
      <p
        className={cn(
          "font-medium text-xs sm:text-sm mb-1",
          variantTextStyles[variant]
        )}
      >
        {label}
      </p>
      <p className="dark:text-white text-slate-900 text-sm sm:text-base font-mono font-bold">
        {value}
      </p>
      {info && <p className="dark:text-slate-400 text-slate-600 text-xs mt-1">{info}</p>}
    </div>
  )
}
