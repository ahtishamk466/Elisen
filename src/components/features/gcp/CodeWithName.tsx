import { Truncate } from '@/components/patterns/Truncate'
import { capWords } from '@/lib/gcpDisplay'

export interface CodeWithNameProps {
  code: string
  /** Empty where the record has no real name — the code then stands alone
      rather than trailing a dash with nothing after it. */
  name: string
}

/**
 * A taxonomy code and what it means, as one line: `A — GENERAL`.
 *
 * The name is capped at ten words before the cell's own truncation takes over,
 * so a long subsection title can't crowd the columns either side of it.
 */
export function CodeWithName({ code, name }: CodeWithNameProps) {
  const text = name ? `${code} — ${capWords(name, 10)}` : code
  return (
    <span className="text-sm text-text-primary">
      <Truncate lines={1}>{text}</Truncate>
    </span>
  )
}
