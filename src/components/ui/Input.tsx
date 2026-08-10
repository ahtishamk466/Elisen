import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error = false, leadingIcon, trailingIcon, className = '', disabled, ...rest },
  ref,
) {
  return (
    <div
      className={`flex h-11 items-center gap-sm rounded-sm border bg-neutral-25 px-base shadow-textfield transition-colors duration-fast
        ${error ? 'border-danger' : 'border-border-default focus-within:border-text-primary'}
        ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      {leadingIcon && <span className="shrink-0 text-text-muted" aria-hidden>{leadingIcon}</span>}
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={error || undefined}
        className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
        {...rest}
      />
      {trailingIcon && <span className="shrink-0 text-text-muted" aria-hidden>{trailingIcon}</span>}
    </div>
  )
})
