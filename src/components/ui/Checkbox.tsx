import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode
  requiredMark?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, requiredMark = false, className = '', disabled, ...rest },
  ref,
) {
  return (
    <label
      className={`inline-flex select-none items-center gap-sm ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} ${className}`}
    >
      <input ref={ref} type="checkbox" disabled={disabled} className="peer sr-only" {...rest} />
      {/* White check on white box is invisible until peer-checked paints the box navy */}
      <span
        aria-hidden
        className="flex h-lg w-lg shrink-0 items-center justify-center rounded-xs border border-border-strong bg-neutral-25 transition-colors duration-fast peer-checked:border-primary-700 peer-checked:bg-primary-700 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-text-primary"
      >
        <svg viewBox="0 0 10 8" fill="none" className="w-full p-xxss" stroke="white" strokeWidth={2}>
          <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label && (
        <span className="text-sm text-text-primary">
          {label}
          {requiredMark && <span className="text-danger">*</span>}
        </span>
      )}
    </label>
  )
})
