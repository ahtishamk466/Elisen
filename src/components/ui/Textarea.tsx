import { forwardRef, type TextareaHTMLAttributes } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error = false, className = '', disabled, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      disabled={disabled}
      aria-invalid={error || undefined}
      rows={3}
      className={`w-full rounded-sm border bg-neutral-25 px-base py-sm text-sm text-text-primary shadow-textfield outline-none transition-colors duration-fast placeholder:text-text-muted
        ${error ? 'border-danger' : 'border-border-default focus:border-text-primary'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      {...rest}
    />
  )
})
