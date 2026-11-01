import type { ReactNode } from 'react'

export interface IdentityCardProps {
  /** Names the `<aside>` landmark, e.g. "Project summary". */
  label: string
  /** The record's identifier, rendered as the page's one `<h1>`. */
  title: string
  /** A tag beside the identifier, e.g. the "Copy" badge on a duplicate. */
  titleBadge?: ReactNode
  /** One line under the heading: the record's title or description. */
  subtitle?: ReactNode
  /** A quieter line under the subtitle, e.g. "Company · Type". */
  meta?: ReactNode
  /** Status badges. */
  badges?: ReactNode
  /** The record's ⋮ `ActionsMenu`. */
  actions?: ReactNode
  /** Key stats: under one divider in a card, to the right of the heading in a band. */
  children?: ReactNode
  /** `card` (default) sits in `RecordLayout` beside the tabs. `band` spans the
      page above the tabs, for a record whose main content is one wide table. */
  layout?: 'card' | 'band'
}

/**
 * The left card of a record page (Figma "Opt-2 – Project Details"): the
 * identifier as the page's large heading, what the record is, its status,
 * then the figures a reader checks first. Sits in `RecordLayout`'s identity
 * slot, beside every tab, so the record stays in view while its sections
 * are read. Layout inside `children` belongs to the caller.
 */
export function IdentityCard({ label, title, titleBadge, subtitle, meta, badges, actions, children, layout = 'card' }: IdentityCardProps) {
  const heading = (
    <div className="flex min-w-0 flex-wrap items-center gap-xs">
      <h1 className="min-w-0 break-words text-2xl font-bold leading-tight text-text-primary">{title}</h1>
      {titleBadge}
    </div>
  )
  /* The band keeps the card's order (heading, subtitle, meta, badges) on the
     left and puts the stats beside it; when the row runs out of room the stats
     wrap under the heading. The ⋮ menu stays top right either way. */
  if (layout === 'band') return (
    <section aria-label={label} className="min-w-0 rounded-sm border border-border-default bg-neutral-25 p-lg">
      <div className="flex items-start gap-lg">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3xl gap-y-base">
          <div className="min-w-0 flex-1" style={{ flexBasis: 280 }}>
            {heading}
            {subtitle && <p className="mt-xxss text-sm text-text-secondary">{subtitle}</p>}
            {meta && <p className="mt-xxss text-xs text-text-muted">{meta}</p>}
            {badges && <div className="mt-sm flex flex-wrap items-center gap-sm">{badges}</div>}
          </div>
          {children}
        </div>
        {actions}
      </div>
    </section>
  )
  return (
    <aside aria-label={label} className="h-fit min-w-0 rounded-sm border border-border-default bg-neutral-25 p-lg">
      <div className="flex items-start justify-between gap-sm">
        {heading}
        {actions}
      </div>
      {subtitle && <p className="mt-sm text-sm text-text-secondary">{subtitle}</p>}
      {meta && <p className="mt-xs text-xs text-text-muted">{meta}</p>}
      {badges && <div className="mt-base flex flex-wrap items-center gap-sm">{badges}</div>}
      {children && <div className="mt-lg border-t border-border-default pt-lg">{children}</div>}
    </aside>
  )
}
