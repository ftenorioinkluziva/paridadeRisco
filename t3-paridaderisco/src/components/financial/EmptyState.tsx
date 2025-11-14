import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "~/lib/utils"

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      {/* Ícone em círculo */}
      <div className="dark:bg-slate-700/30 bg-slate-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 dark:text-slate-400 text-slate-600" />
      </div>

      {/* Título */}
      <h6 className="dark:text-slate-300 text-slate-700 font-medium mb-2 text-base sm:text-lg">
        {title}
      </h6>

      {/* Descrição */}
      <p className="dark:text-slate-400 text-slate-600 text-sm leading-relaxed max-w-sm mx-auto mb-6">
        {description}
      </p>

      {/* Ação (opcional) */}
      {action && <div>{action}</div>}
    </div>
  )
}
