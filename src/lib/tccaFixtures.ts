/* Generated from the client TPMS database export (2026-08-27).
   People are stand-ins; business records are the client's own.
   Regenerate with tools/ (see tools/README.md) — do not hand-edit. */
import type { TccaProject } from '@/types/tcca'

/** Next number in the client's A-YY-NNNN series. */
export function getNextTccaNumber(existing: TccaProject[]): string {
  const year = String(new Date().getFullYear()).slice(-2)
  const prefix = `A-${year}-`
  const used = existing
    .filter((t) => t.number.startsWith(prefix))
    .map((t) => Number(t.number.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n))
  return `${prefix}${String(used.length ? Math.max(...used) + 1 : 1).padStart(4, '0')}`
}
