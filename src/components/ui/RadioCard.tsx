import { forwardRef, type InputHTMLAttributes } from 'react'

export interface RadioCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'title'> {
  title: string
  description?: string
}

export const RadioCard = forwardRef<HTMLInputElement, RadioCardProps>(function RadioCard(
  { title, description, className = '', disabled, checked, ...rest },
  ref,
) {
  return (
    <label
      className={`flex items-start gap-sm rounded-sm border p-lg transition-colors duration-fast
        ${checked ? 'border-accent bg-accent-subtle' : 'border-border-default bg-neutral-25 hover:border-border-strong'}
        ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} ${className}`}
    >
      <input ref={ref} type="radio" disabled={disabled} checked={checked} className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className={`mt-xxss flex h-lg w-lg shrink-0 items-center justify-center rounded-full border transition-colors duration-fast peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-text-primary
          ${checked ? 'border-accent' : 'border-border-strong bg-neutral-25'}`}
      >
        {checked && <span className="h-sm w-sm rounded-full bg-accent" />}
      </span>
      <span>
        <span className="block text-sm font-semibold text-text-primary">{title}</span>
        {description && <span className="mt-xxss block text-xs text-text-muted">{description}</span>}
      </span>
    </label>
  )
})
