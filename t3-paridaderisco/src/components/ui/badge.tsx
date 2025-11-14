import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition-fast",
  {
    variants: {
      variant: {
        default: "dark:bg-slate-700/50 bg-slate-100 dark:text-slate-300 text-slate-700 border dark:border-slate-600 border-slate-300",
        primary: "dark:bg-blue-600/20 bg-blue-100 dark:text-blue-300 text-blue-700 border-transparent",
        secondary: "dark:bg-slate-700 bg-slate-200 dark:text-slate-300 text-slate-700 border-transparent",
        success: "dark:bg-green-600/20 bg-green-100 dark:text-green-300 text-green-700 border-transparent",
        error: "dark:bg-red-600/20 bg-red-100 dark:text-red-300 text-red-700 border-transparent",
        warning: "dark:bg-yellow-600/20 bg-yellow-100 dark:text-yellow-300 text-yellow-700 border-transparent",
        info: "dark:bg-blue-600/20 bg-blue-100 dark:text-blue-300 text-blue-700 border-transparent",
        active: "bg-blue-600 text-white border-transparent",
        outline: "dark:text-slate-300 text-slate-700 border dark:border-slate-600 border-slate-300 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
