import type { ReactNode } from 'react'

export interface StatProps {
  label: string
  children?: ReactNode
  /** Plain-language tooltip on the label, for figures that need a definition
      ("Overtime — no budget covers it") without spending a line on it. */
  hint?: string
  /** Short codes (serial no, company number, IDs) must never wrap — a 2-line
      code reads as broken, not as data. Long free text should use <Truncate>
      instead, never this. */
  nowrap?: boolean
  /** Render as <dt>/<dd> when the Stat sits inside a <dl>; the default <p>
      pair is for plain grids. Same pixels either way — only the semantics
      change. */
  dl?: boolean
}

/**
 * THE label/value stat pair, everywhere a figure sits under its name: detail
 * cards, summary strips, header stat bands. One spec, fixed by the client
 * against the Project Overview "Dates" card:
 *
 *   label — 12px, regular, Neutral 500 (`text-text-muted`)
 *   value — 14px, semibold, Neutral 950 (`text-text-primary`)
 *   gap   — 2px (`mt-xxss`)
 *
 * Before this existed the same pair was hand-rolled five ways (12px/14px,
 * 12px/18px-bold, 14px/16px, 14px/14px…) and every new screen drifted a
 * little further. Change the look here, and every stat in the app follows.
 *
 * An empty value renders an em dash, so blank is visibly distinct from a
 * real value. Layout (grid placement, dividers, padding between stats)
 * belongs to the caller — this component owns only the pair itself.
 */
export function Stat({ label, children, hint, nowrap = false, dl = false }: StatProps) {
  const isEmpty = children === undefined || children === null || children === ''
  const labelClass = 'text-xs font-normal text-text-muted'
  const valueClass = `mt-xxss text-sm font-semibold text-text-primary ${nowrap ? 'whitespace-nowrap' : ''}`
  const value = isEmpty ? '—' : children

  if (dl) {
    return (
      <div className="min-w-0">
        <dt title={hint} className={labelClass}>{label}</dt>
        <dd className={valueClass}>{value}</dd>
      </div>
    )
  }
  return (
    <div className="min-w-0">
      <p title={hint} className={labelClass}>{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  )
}
