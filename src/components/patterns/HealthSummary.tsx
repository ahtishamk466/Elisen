import { Badge } from '@/components/ui/Badge'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct, type Health } from '@/lib/projectHealth'

export interface HealthSummaryProps {
  health: Health
}

/**
 * The budget read-out: Budget → Actual → Remaining → Budget used, one compact
 * stat box each, matching the Projects List's own tiles so the two screens
 * read the same.
 *
 * Remaining keeps its label whether positive or negative and goes signed
 * (−70h) when over, rather than flipping to an "Over by" label — one stable
 * label with a sign is less to parse than a label that changes meaning. That
 * sign, the percentage, and the status chip together explain an over-100%
 * figure without needing either a sentence or a bar in the card, so all four
 * boxes stay exactly the same height as the Projects List tiles.
 */
export function HealthSummary({ health }: HealthSummaryProps) {
  const { budget, actual, remaining, progressPct, state } = health
  // With no budget there is nothing to be over or remaining, so those read as
  // em dashes rather than as a real 0.
  const noBudget = state === 'no-budget'
  const over = !noBudget && remaining < 0

  const figures = [
    { label: 'Budget hours', value: noBudget ? '—' : formatHours(budget), tone: 'text-text-primary' },
    { label: 'Actual hours', value: formatHours(actual), tone: 'text-text-primary' },
    {
      label: 'Remaining hours',
      value: noBudget ? '—' : `${over ? '−' : ''}${formatHours(Math.abs(remaining))}`,
      // Figures stay black app-wide; the status badge carries the state, and
      // the minus sign already marks a negative remainder without colour.
      tone: 'text-text-primary',
    },
  ]

  return (
    <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
      {figures.map((f) => (
        <div key={f.label} className="rounded-sm border border-border-default bg-neutral-25 p-lg">
          <p className="text-sm text-text-secondary">{f.label}</p>
          <p className={`mt-xs text-3xl font-bold ${f.tone}`}>{f.value}</p>
        </div>
      ))}

      <div className="rounded-sm border border-border-default bg-neutral-25 p-lg">
        <div className="flex items-center justify-between gap-sm">
          {/* "Budget used", not "Progress" — hours consumed against hours
              budgeted, which legitimately passes 100%. */}
          <p className="text-sm text-text-secondary">Budget used</p>
          <Badge tone={HEALTH_TONE[state]}>{HEALTH_LABEL[state]}</Badge>
        </div>
        <p className="mt-xs text-3xl font-bold text-text-primary">{formatPct(progressPct)}</p>
      </div>
    </div>
  )
}
