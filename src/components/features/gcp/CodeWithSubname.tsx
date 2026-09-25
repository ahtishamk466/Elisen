const CHAR_LIMIT = 8

export interface CodeWithSubnameProps {
  code: string
  /** Who or what the code is assigned to — a FOC's specialist, a MOC's
      title, a discipline's own name. Empty renders the code alone, same as
      before this existed. */
  name?: string
}

/**
 * A reference code with what it's assigned to underneath — code on top,
 * name below it, exactly like every other primary/secondary cell in the app
 * (`DocumentsPage`'s Title/Type, `RegulationListPage`'s TCCA Project). Client
 * instruction, 2026-09-25: a bare code (`AP-01`) told the reader nothing —
 * "user ko asani ho ke wo table view mein code ke sath dekh le ye code kis
 * ke against assign hai" — so the name joins it, capped to 8 characters
 * (the client's own number) so a long specialist name or MOC title can't
 * widen the column, with the **full** name on hover (native `title`, same
 * as every other truncated cell in this app rather than a custom tooltip).
 *
 * Character-capped, not `Truncate`'s line-clamp: the client asked for a
 * fixed letter count under the code, not "however much fits."
 */
export function CodeWithSubname({ code, name }: CodeWithSubnameProps) {
  if (!name) return <span className="block truncate text-sm text-text-primary">{code}</span>
  const short = name.length > CHAR_LIMIT ? `${name.slice(0, CHAR_LIMIT)}…` : name
  return (
    <span className="block min-w-0">
      <span className="block truncate text-sm text-text-primary">{code}</span>
      <span className="block truncate text-xs text-text-muted" title={name}>{short}</span>
    </span>
  )
}
