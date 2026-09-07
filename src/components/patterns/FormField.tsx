import type { ReactNode } from 'react'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  description?: string
  help?: string
  error?: string
  counter?: string
  /** Stacks the label above the control at the full width of the section,
      instead of the standard label-left/control-right split. For the rare
      field (e.g. a comment box) that needs more room than the shared
      two-thirds control column gives it. */
  fullWidth?: boolean
  children: ReactNode
}

export function FormField({ label, htmlFor, required, description, help, error, counter, fullWidth = false, children }: FormFieldProps) {
  return (
    <div className={fullWidth ? 'grid gap-xs' : 'grid gap-xs tablet:grid-cols-3 tablet:items-start tablet:gap-lg'}>
      <label htmlFor={htmlFor} className={`text-sm font-semibold text-text-primary ${fullWidth ? '' : 'tablet:pt-base'}`}>
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      <div className={fullWidth ? 'grid gap-xs' : 'grid gap-xs tablet:col-span-2'}>
        {(description || counter) && (
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-text-muted">{description}</span>
            {counter && <span className="text-xs text-text-muted">{counter}</span>}
          </div>
        )}
        {children}
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : help ? (
          <p className="text-xs text-text-muted">{help}</p>
        ) : null}
      </div>
    </div>
  )
}
