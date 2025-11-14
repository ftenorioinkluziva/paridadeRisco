import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md px-3 py-2 text-base font-bold transition-default file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default:
          "dark:bg-slate-700 bg-white border dark:border-slate-600 border-slate-300 dark:text-white text-slate-900 dark:placeholder:text-slate-500 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        error:
          "dark:bg-slate-700 bg-white border-2 border-red-500 dark:text-white text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
        success:
          "dark:bg-slate-700 bg-white border border-green-500 dark:text-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
