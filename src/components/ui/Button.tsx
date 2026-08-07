import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 px-sm gap-xs text-xs',
  md: 'h-9 px-base gap-xs text-sm',
  lg: 'h-11 px-lg gap-sm text-sm',
  xl: 'h-14 px-xl gap-sm text-base',
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border border-primary-900 bg-primary-900 text-text-inverse hover:bg-primary-800 hover:border-primary-800 active:bg-primary-950 active:border-primary-950 disabled:bg-neutral-100 disabled:border-neutral-200 disabled:text-text-muted',
  secondary:
    'border border-border-strong bg-transparent text-text-primary hover:border-text-primary active:bg-accent-subtle disabled:border-neutral-200 disabled:text-neutral-300',
  tertiary:
    'border border-transparent bg-transparent text-text-primary hover:text-accent hover:underline underline-offset-2 active:text-primary-700 disabled:text-neutral-300 disabled:no-underline',
  danger:
    'border border-danger bg-danger text-text-inverse hover:bg-danger-hover hover:border-danger-hover active:bg-danger-active active:border-danger-active disabled:bg-neutral-100 disabled:border-neutral-200 disabled:text-text-muted',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, leadingIcon, trailingIcon, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center whitespace-nowrap font-semibold rounded-sm transition-colors duration-fast select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:cursor-not-allowed ${loading ? 'cursor-wait' : ''} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {loading ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  )
})
