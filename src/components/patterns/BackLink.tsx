import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export type BackLinkProps = { label: string } & (
  | { to: string; onClick?: never }
  | { onClick: () => void; to?: never }
)

const CLASS = 'inline-flex items-center gap-sm rounded-sm text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary'

/**
 * The record page's header: "Go back to all <records>", in place of a title
 * the identity card already carries as the page's `<h1>`. A real link when it
 * has a route (`to`), so it opens in a new tab like any other link; a button
 * only when going back needs more than a route (`onClick`).
 */
export function BackLink(props: BackLinkProps) {
  const content = <><ArrowLeft size={18} aria-hidden />{props.label}</>
  if (props.to !== undefined) return <Link to={props.to} className={CLASS}>{content}</Link>
  return <button type="button" onClick={props.onClick} className={CLASS}>{content}</button>
}
