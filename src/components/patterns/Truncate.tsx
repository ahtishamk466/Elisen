export interface TruncateProps {
  children: string
  /** Defaults to 2 — long free text (titles, descriptions, comments,
      model names) clips after this many lines instead of stretching the
      whole table row. The native `title` attribute surfaces the full text
      on hover, so nothing is actually hidden from the user. */
  lines?: 1 | 2
}

export function Truncate({ children, lines = 2 }: TruncateProps) {
  if (!children) return <>{children}</>
  return (
    <span className={lines === 1 ? 'line-clamp-1' : 'line-clamp-2'} title={children}>
      {children}
    </span>
  )
}
