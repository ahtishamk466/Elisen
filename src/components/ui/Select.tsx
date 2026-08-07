import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error = false, placeholder, className = '', disabled, children, ...rest },
  ref,
) {
  return (
    <div
      className={`relative flex h-11 items-center rounded-sm border bg-neutral-25 shadow-textfield transition-colors duration-fast
        ${error ? 'border-danger' : 'border-border-default focus-within:border-text-primary'}
        ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={error || undefined}
        className="w-full appearance-none bg-transparent px-base pr-4xl text-sm text-text-primary outline-none disabled:cursor-not-allowed"
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-base text-text-muted" aria-hidden />
    </div>
  )
})
