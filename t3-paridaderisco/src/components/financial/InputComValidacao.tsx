import * as React from "react"
import { AlertTriangle, Info } from "lucide-react"

import { cn } from "~/lib/utils"
import { Input, type InputProps } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

export interface InputComValidacaoProps extends Omit<InputProps, "variant"> {
  label?: string
  error?: string
  hint?: string
  dynamicInfo?: string
  icon?: React.ReactNode
  required?: boolean
}

export const InputComValidacao = React.forwardRef<
  HTMLInputElement,
  InputComValidacaoProps
>(
  (
    {
      label,
      error,
      hint,
      dynamicInfo,
      icon,
      required,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId()
    const hasError = !!error

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <Label
            htmlFor={inputId}
            className="dark:text-slate-300 text-slate-700 text-sm font-medium block"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Ícone esquerdo (opcional) */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input */}
          <Input
            id={inputId}
            ref={ref}
            variant={hasError ? "error" : "default"}
            className={cn(icon && "pl-10", className)}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : hint
                  ? `${inputId}-hint`
                  : dynamicInfo
                    ? `${inputId}-info`
                    : undefined
            }
            {...props}
          />

          {/* Ícone de erro (direito) */}
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Mensagem de erro */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-400 flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>{error}</span>
          </p>
        )}

        {/* Dica contextual */}
        {!hasError && hint && (
          <p id={`${inputId}-hint`} className="text-xs dark:text-slate-400 text-slate-600">
            {hint}
          </p>
        )}

        {/* Informação dinâmica (dados em tempo real) */}
        {!hasError && dynamicInfo && (
          <p
            id={`${inputId}-info`}
            className="text-xs dark:text-blue-400 text-blue-600 flex items-center gap-1"
          >
            <Info className="h-3 w-3" />
            <span>{dynamicInfo}</span>
          </p>
        )}
      </div>
    )
  }
)
InputComValidacao.displayName = "InputComValidacao"
