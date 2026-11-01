import type { ReactNode } from 'react'

export interface RecordLayoutProps {
  /** The record's `IdentityCard`. */
  identity: ReactNode
  /** The main column: `SectionTabs` and the open tab's content. */
  children: ReactNode
}

/**
 * Every record page's body (Figma "Opt-2 – Project Details"): a 320px identity
 * card on the left that stays beside every tab, the section tabs and their
 * content on the right. Below laptop the two stack, card first.
 */
export function RecordLayout({ identity, children }: RecordLayoutProps) {
  return (
    <div className="grid items-start gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
      {identity}
      <div className="grid min-w-0 content-start gap-lg">{children}</div>
    </div>
  )
}
