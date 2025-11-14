import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow hover:bg-blue-700 hover:scale-[1.02]",
        destructive:
          "dark:bg-red-900/20 bg-red-50 dark:text-red-400 text-red-700 dark:border dark:border-red-700 border border-red-300 dark:hover:bg-red-900/30 hover:bg-red-100 dark:hover:text-red-300 hover:text-red-800",
        outline:
          "border dark:border-slate-500 border-slate-300 dark:text-slate-300 text-slate-700 bg-transparent dark:hover:bg-slate-600/50 hover:bg-slate-100 dark:hover:text-white hover:text-slate-900",
        secondary:
          "dark:bg-slate-700 bg-slate-100 dark:text-slate-300 text-slate-700 dark:hover:bg-slate-600 hover:bg-slate-200 dark:hover:text-white hover:text-slate-900",
        ghost: "dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-600/50 hover:bg-slate-100",
        link: "dark:text-blue-400 text-blue-600 underline-offset-4 hover:underline dark:hover:text-blue-300 hover:text-blue-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
