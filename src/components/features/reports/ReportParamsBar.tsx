import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { PEOPLE } from '@/lib/projectFixtures'
import type { ReportParam } from '@/lib/reportCatalog'

export type ParamValues = Record<string, string>

export interface ReportParamsBarProps {
  params: ReportParam[]
  /** Pre-filled starting point — the fields arrive populated, but nothing is
      applied until the reader confirms it. */
  initial: ParamValues
  /** What the preview is currently built from; `null` before the first Apply. */
  applied: ParamValues | null
  onApply: (values: ParamValues) => void
  onClear: () => void
}

/** Same keys, same values — used to tell "edited" from "already applied". */
function sameValues(params: ReportParam[], a: ParamValues | null, b: ParamValues) {
  if (!a) return false
  return params.every((p) => (a[p.key] ?? '') === (b[p.key] ?? ''))
}

/**
 * A report's parameters, with **Apply** and **Clear**.
 *
 * The range is never applied as you type. A report is a document someone
 * hands on, so the range it covers is a deliberate choice, confirmed once —
 * and a half-typed date (`2026-08-0`) would otherwise regenerate the whole
 * preview on the way to a real one.
 *
 * The fields arrive pre-filled with a sensible default so the first Apply is
 * one click rather than two date pickers, but that default is *shown, not
 * assumed* — nothing is previewed or downloadable until it is confirmed.
 */
export function ReportParamsBar({ params, initial, applied, onApply, onClear }: ReportParamsBarProps) {
  const [draft, setDraft] = useState<ParamValues>(initial)
  const setField = (key: string, value: string) => setDraft((prev) => ({ ...prev, [key]: value }))

  const dateParams = params.filter((p) => p.kind === 'date')
  const selectParams = params.filter((p) => p.kind === 'select')

  const missing = params.filter((p) => p.required && !draft[p.key])
  const rangeInvalid = !!draft.startDate && !!draft.endDate && draft.startDate > draft.endDate
  const valid = missing.length === 0 && !rangeInvalid

  const unchanged = sameValues(params, applied, draft)
  /* Clear is about undoing a selection — it has nothing to undo only when the
     fields are already empty and no preview is standing. */
  const clearable = applied !== null || params.some((p) => draft[p.key])

  return (
    <div className="border-b border-border-default bg-neutral-50 px-lg py-base">
      {/* One row: every field sizes to what its value actually needs — a date
          reads as ten characters, a name as a handful of words — rather than
          a fixed width chosen to look even, which was the empty space here.
          Clear/Apply sit right after the last field instead of pushed to the
          trailing edge (`ml-auto`), so a wide pane doesn't stretch a gap
          between them. */}
      <div className="flex flex-wrap items-end gap-lg">
        {dateParams.length > 0 && (
          /* No visible group label — the Start Date / End Date field labels
             already say what these are. The sr-only legend still names the
             pair for assistive tech. A <legend> always renders on its own
             line above a <fieldset> regardless of the fieldset's own
             display, so it has to stay screen-reader-only, not just unstyled,
             or the empty row comes back. */
          <fieldset className="flex flex-wrap items-end gap-lg">
            <legend className="sr-only">Date range</legend>
            {dateParams.map((p) => (
              <div key={p.key} style={{ width: 148 }}>
                <label htmlFor={`param-${p.key}`} className="mb-xs block text-sm font-semibold text-text-primary">
                  {p.label}{p.required && <span className="text-danger">*</span>}
                </label>
                <Input
                  id={`param-${p.key}`} type="date" value={draft[p.key] ?? ''}
                  error={rangeInvalid && p.key === 'endDate'}
                  onChange={(e) => setField(p.key, e.target.value)}
                />
              </div>
            ))}
          </fieldset>
        )}

        {selectParams.map((p) => (
          <div key={p.key} className="min-w-0" style={{ width: 200 }}>
            <label htmlFor={`param-${p.key}`} className="mb-xs block text-sm font-semibold text-text-primary">
              {p.label}{p.required && <span className="text-danger">*</span>}
            </label>
            <PersonSelect
              id={`param-${p.key}`} value={draft[p.key] ?? ''}
              placeholder={`Select ${p.label.toLowerCase()}...`} people={PEOPLE}
              onChange={(v) => setField(p.key, v)}
            />
          </div>
        ))}

        <div className="flex items-center gap-sm">
          <Button variant="secondary" disabled={!clearable} onClick={() => { setDraft({}); onClear() }}>
            Clear
          </Button>
          <Button disabled={!valid || unchanged} onClick={() => onApply(draft)}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}
