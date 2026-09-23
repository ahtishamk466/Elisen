import { ChipOverflow } from '@/components/patterns/ChipOverflow'

export interface GcpChipProps {
  value: string
  /** Names the list for assistive tech, e.g. "amendments". */
  label: string
}

/**
 * An identifier as a chip — an amendment, a section root.
 *
 * A placeholder the legacy data stores as a dash is printed as a bare dash
 * instead: a chip says "here is a value", and wrapping an absence in one makes
 * ten empty boxes down the column read as data.
 */
export function GcpChip({ value, label }: GcpChipProps) {
  const v = value.trim()
  if (!v || /^-+$/.test(v)) return <span className="text-sm text-text-muted">{v || '—'}</span>
  return <ChipOverflow items={[v]} label={label} />
}
