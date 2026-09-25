import { ExternalLink, FileText } from 'lucide-react'
import { isOpenableUrl } from './UrlField'

export interface FileLinkProps {
  /** Where the file lives. Anything not openable renders as plain text
      rather than a dead link. */
  url?: string
  /** What to show — a filename where the record has one. Defaults to the
      URL itself, which is all a SharePoint link gives us. */
  label?: string
}

/**
 * A stored file, shown the way a file should be shown: **one line, clipped,
 * and clickable**.
 *
 * A file reference in this app is usually a SharePoint URL with no filename
 * in it — 120+ characters of unbreakable token. Printed as a plain value it
 * either overflowed its card or, once `Stat` learned to `break-words`, wrapped
 * to five lines and pushed everything under it down the drawer (client
 * instruction, 2026-09-25: "make it fill in this container… and a link
 * clickable. where files comes it must be clickable"). So the text truncates
 * to a single line, the full value stays on `title` for hover, and the whole
 * thing opens in a new tab.
 *
 * `truncate` needs a definite width to clip against, which is why this is a
 * `flex` box with `min-w-0` — the caller only has to give it a container that
 * can shrink (a grid/flex cell with `min-w-0`, which `Stat` already provides).
 *
 * Replaces four hand-rolled copies of the same anchor (regulation source
 * links, approval document cells): one file-link style, changed in one place.
 */
export function FileLink({ url = '', label }: FileLinkProps) {
  const text = label ?? url
  if (!text.trim()) return <span className="text-text-muted">—</span>

  /* No link to open — the record names a file but never stored where it
     lives. Still worth showing the name, just not as something clickable. */
  if (!isOpenableUrl(url)) {
    return (
      <span className="flex min-w-0 items-center gap-xs" title={text}>
        <FileText size={14} className="shrink-0 text-text-muted" aria-hidden />
        <span className="truncate">{text}</span>
      </span>
    )
  }

  return (
    <a
      href={url.trim()}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      /* Underlined always, not just on hover (client instruction,
         2026-09-25: "blue or underline jis se pata lage ke ye clickable
         hai"). A file name in a table cell reads as data, not as a control,
         so a hover-only underline means nobody discovers it without
         sweeping the mouse across the column first. Colour alone wouldn't
         carry it either — CLAUDE.md rule 6, never signal by colour alone. */
      className="flex min-w-0 items-center gap-xs rounded-sm text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
    >
      <ExternalLink size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{text}</span>
    </a>
  )
}
