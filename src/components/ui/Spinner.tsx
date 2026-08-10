import { LoaderCircle } from 'lucide-react'

export interface SpinnerProps {
  size?: number
  label?: string
  className?: string
}

export function Spinner({ size = 20, label = 'Loading', className = '' }: SpinnerProps) {
  return (
    <span role="status" className={`inline-flex items-center justify-center ${className}`}>
      <LoaderCircle size={size} className="animate-spin text-accent" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}
