import { Check } from 'lucide-react'

export interface StepperProps {
  steps: string[]
  current: number
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center gap-sm">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className={`flex items-center gap-sm ${i < steps.length - 1 ? 'flex-1' : ''}`}>
            <span
              aria-hidden
              className={`flex h-2xl w-2xl shrink-0 items-center justify-center rounded-full text-xs font-semibold
                ${done ? 'bg-success text-text-inverse' : active ? 'border-strong border-text-primary text-text-primary' : 'border border-border-default text-text-muted'}`}
            >
              {done ? <Check size={13} /> : i + 1}
            </span>
            <span
              className={`whitespace-nowrap text-sm ${active ? 'font-semibold text-text-primary' : done ? 'text-text-primary' : 'text-text-muted'}`}
              aria-current={active ? 'step' : undefined}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span aria-hidden className={`h-px flex-1 ${done ? 'bg-text-primary' : 'bg-border-default'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
