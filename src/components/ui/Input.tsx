import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  /**
   * `md` (44px) is the form default. `sm` (36px) is for toolbar rows — page
   * headers and inline "field + button" pairs — where the field must sit level
   * with a default Button, which is 36px.
   */
  size?: 'sm' | 'md'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error = false, leadingIcon, trailingIcon, className = '', disabled, size = 'md', ...rest },
  ref,
) {
  return (
    <div
      className={`flex ${size === 'sm' ? 'h-9' : 'h-11'} items-center gap-sm rounded-sm border bg-neutral-25 px-base shadow-textfield transition-colors duration-fast
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
