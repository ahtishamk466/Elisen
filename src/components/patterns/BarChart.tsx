export interface BarChartDatum {
  /** Axis label under the bar, e.g. "Thu 06 Aug". */
  label: string
  value: number
}

export interface BarChartProps {
  data: BarChartDatum[]
  /** Names the series for screen readers and the data table's caption. */
  caption: string
  /** Accent for ordinary counts; danger only where the series *is* a fault
      count, so the color repeats what the title already says. */
  tone?: 'accent' | 'danger'
  /** Plot height in px — the bars' area, excluding axis labels. */
  height?: number
  format?: (value: number) => string
  /** Shown in place of the plot when every value is zero. */
  emptyLabel?: string
}

/** Widest a single bar gets. Past this the mark stops reading as a bar and
    starts reading as a filled block. */
const MAX_BAR_WIDTH = 44

/**
 * Builds the axis from a round *step* rather than a round maximum, so every
 * gridline is a number a reader can hold in their head — 0/2 000/4 000/6 000,
 * never 0/12.5/25/37.5/50.
 */
function axis(peak: number): { max: number; ticks: number[] } {
  if (peak <= 0) return { max: 0, ticks: [] }
  const rough = peak / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((s) => rough <= s * magnitude) ?? 10) * magnitude
  const max = Math.ceil(peak / step) * step
  const ticks: number[] = []
  for (let v = max; v >= 0; v -= step) ticks.push(v)
  return { max, ticks }
}

/**
 * Single-series bar chart, built from tokens — the app has no chart library
 * and one series doesn't warrant one. Bars are HTML, not SVG, so labels stay
 * at their real type size at every width instead of scaling with a viewBox.
 *
 * One series only by design: a second measure on the same plot means a second
 * scale, so it belongs in its own chart beside this one.
 */
export function BarChart({
  data, caption, tone = 'accent', height = 180, format = (v) => String(v), emptyLabel = 'Nothing recorded',
}: BarChartProps) {
  const peak = Math.max(0, ...data.map((d) => d.value))
  const { max, ticks } = axis(peak)

  return (
    <figure className="grid gap-sm">
      {max === 0 ? (
        <div
          className="flex items-center justify-center rounded-sm border border-dashed border-border-default bg-neutral-50 text-sm text-text-muted"
          style={{ height }}
        >
          {emptyLabel}
        </div>
      ) : (
        <div className="flex gap-sm">
          {/* Y axis: labelled ticks aligned to the gridlines they name. */}
          <div className="flex shrink-0 flex-col justify-between text-right text-xs text-text-muted" style={{ height }}>
            {ticks.map((t) => <span key={t}>{format(t)}</span>)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative" style={{ height }}>
              {/* Gridlines sit behind the bars and stay recessive. */}
              <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
                {ticks.map((t) => <span key={t} className="block h-px w-full bg-border-default" />)}
              </div>
              <div className="absolute inset-0 flex items-end gap-xxss">
                {data.map((d) => {
                  const pct = (d.value / max) * 100
                  return (
                    <div key={d.label} className="group flex h-full flex-1 items-end justify-center">
                      {/* Rounded top only — the bar is anchored to the
                          baseline, so a rounded foot would lift it off. */}
                      <div
                        title={`${d.label}: ${format(d.value)}`}
                        className={`w-full rounded-t-xs transition-opacity duration-fast group-hover:opacity-80
                          ${tone === 'danger' ? 'bg-danger' : 'bg-accent'}`}
                        style={{ height: `${pct}%`, minHeight: d.value > 0 ? 2 : 0, maxWidth: MAX_BAR_WIDTH }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-xs flex gap-xxss">
              {data.map((d) => (
                <span key={d.label} className="flex-1 text-center text-xs text-text-muted">{d.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* The same numbers as a table — identity and value never depend on
          reading a bar height, and this is what a screen reader gets. */}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr><th scope="col">Day</th><th scope="col">Count</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><th scope="row">{d.label}</th><td>{format(d.value)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
