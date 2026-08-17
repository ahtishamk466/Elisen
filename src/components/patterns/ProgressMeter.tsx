import { HEALTH_TONE, formatHours, formatPct, type Health } from '@/lib/projectHealth'

const FILL: Record<string, string> = {
  neutral: 'bg-neutral-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-accent',
}

export interface ProgressMeterProps {
  health: Health
  /** Names the bar for screen readers, e.g. "Certification Plan budget". */
  ariaLabel: string
  /** Percent + hours above the bar. Off for dense table cells. */
  showLabel?: boolean
  size?: 'sm' | 'md'
}

/**
 * The four figures a reader actually needs: spent, budget, and what is left
 * (or over). Kept in one helper so the work-package header, the meter's own
 * label and any future surface phrase it identically.
 *
 * Deliberately "used" and not "done": this percentage is hours spent against
 * hours budgeted, not work completed. Calling 130% "done" is the confusion the
 * client already flagged on the 106% tile.
 */
export function budgetSummary(health: Health): string {
  const { budget, actual, remaining, progressPct } = health
  if (progressPct === null) return `${formatHours(actual)} spent, no budget set`
  const tail = remaining < 0
    ? `${formatHours(Math.abs(remaining))} over`
    : `${formatHours(remaining)} left`
  return `${formatHours(actual)} spent of ${formatHours(budget)}, ${tail}`
}

/**
 * Budget consumed, as a thin bar. **One style everywhere:** the track is always
 * `neutral-300` so the unfilled part stays visible against a white card, the
 * fill runs 0-100% of budget, and only the fill's colour changes with state
 * (green / amber / red).
 *
 * Past 100% the bar is simply full and red. It does not rescale and there is no
 * budget notch: that was a second visual language, it hid the track, and it made
 * an over-budget bar render *shorter* than an on-track one. The overrun is
 * carried by the figure beside it ("120% used"), where a number above 100 is
 * itself a non-colour signal, so state is never colour-only.
 */
export function ProgressMeter({ health, ariaLabel, showLabel = false, size = 'md' }: ProgressMeterProps) {
  const { progressPct, state, budget, actual } = health
  const pct = progressPct ?? 0
  const over = pct > 100
  const fill = FILL[HEALTH_TONE[state]] ?? FILL.neutral

  return (
    <div className="grid gap-xs">
      {showLabel && (
        <div className="flex items-baseline justify-between gap-sm">
          <span className="text-xs font-semibold text-text-primary">
            {formatPct(progressPct)} of budget used
          </span>
          <span className="text-xs text-text-secondary">{budgetSummary(health)}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={Math.max(100, Math.round(pct))}
        aria-valuetext={
          progressPct === null ? 'No budget set'
            : over ? `${Math.round(pct)}% of budget used, over by ${formatHours(Math.abs(health.remaining))}`
              : `${Math.round(pct)}% of budget used`
        }
        title={progressPct === null ? 'No budget set' : `${formatHours(actual)} of ${formatHours(budget)}: ${formatPct(progressPct)}`}
        className={`relative w-full overflow-hidden rounded-full bg-neutral-300 ${size === 'sm' ? 'h-xs' : 'h-sm'}`}
      >
        {progressPct !== null && (
          <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.min(100, pct)}%` }} />
        )}
      </div>
    </div>
  )
}
