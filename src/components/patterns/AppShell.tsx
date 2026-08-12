import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Clock, ListChecks, ShieldCheck, Database, Settings, ChevronDown, ChevronRight, KeyRound } from 'lucide-react'
import { SidebarProfile } from './SidebarProfile'

/** Top-level items without children that have a real screen — rendered as
    router Links; the rest stay inert until their screens exist. */
const TOP_ROUTES: Record<string, string> = {
  'Reports': '/reports',
}

/** Children with real routes render as router Links; the rest stay inert
    until their screens exist. */
const CHILD_ROUTES: Record<string, string> = {
  'Projects List': '/projects',
  'Projects Review': '/projects/review',
  'TCCA Projects': '/tcca-projects',
  'Timesheet': '/timesheet',
  'Hours Worked': '/hours-worked',
  'Users': '/admin/users',
  'Roles & Permissions': '/admin/roles',
  // The route registry + rules page — named "Routes" now that "System" is a
  // top-level section of its own.
  'Routes': '/admin/system',
  'Companies': '/admin/companies',
  'Aircraft': '/admin/aircraft',
  'ATA Chapters': '/admin/ata-chapters',
  'Software Settings': '/system/settings',
  'Audit Control': '/system/audit',
  'Database Management': '/system/database',
}

interface NavItem {
  label: string
  icon: ReactNode
  children?: string[]
}

const NAV: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Projects', icon: <FolderOpen size={18} />, children: ['Projects List', 'Projects Review', 'TCCA Projects'] },
  { label: 'Time Entry', icon: <Clock size={18} />, children: ['Hours Worked', 'Timesheet'] },
  { label: 'Reports', icon: <ListChecks size={18} /> },
  { label: 'GCP', icon: <ShieldCheck size={18} />, children: [] },
  // Three administrative sections split by *what* they hold, not by who is
  // senior enough to see them: business data staff maintain, access
  // management, and machine-side tooling. Ordered most-used first, and each
  // gated as a whole rather than child-by-child.
  { label: 'Reference Data', icon: <Database size={18} />, children: ['Companies', 'Aircraft', 'ATA Chapters'] },
  { label: 'User Access', icon: <KeyRound size={18} />, children: ['Users', 'Roles & Permissions', 'Routes'] },
  { label: 'System', icon: <Settings size={18} />, children: ['Software Settings', 'Audit Control', 'Database Management'] },
]

export interface AppShellProps {
  activeItem?: string
  activeChild?: string
  title: string
  /** Overrides the default `<h1>{title}</h1>` — e.g. a "back to list" link
      instead of repeating a title already shown on the page (Project Detail,
      TCCA Project Detail). */
  headerLeft?: ReactNode
  /** Page-level controls (search, filters, primary CTA) rendered on the same
      line as the heading, aligned right. Keeps every list page identical. */
  headerActions?: ReactNode
  children: ReactNode
}

export function AppShell({ activeItem = 'Projects', activeChild = 'Projects List', title, headerLeft, headerActions, children }: AppShellProps) {
  // Expansion is independent of the current route — otherwise a parent
  // section (e.g. Time Entry) can only ever open on pages already inside it,
  // making it look unclickable everywhere else. Defaults to whichever
  // section the current page belongs to, but any parent can be toggled open
  // to browse its children before navigating.
  const [expanded, setExpanded] = useState(activeItem)

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sticky + fixed to the viewport height (not the page's, which can be
          taller) so the profile footer stays above the fold at any scroll
          position; the nav list scrolls internally if it ever overflows. */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-primary-700 laptop:flex">
        <div className="px-lg py-xl">
          <img src="/logo-elisen.svg" alt="Elisen" width={600} height={104} className="h-6 w-auto brightness-0 invert" />
        </div>
        <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto">
          <ul className="grid gap-xxss px-base">
            {NAV.map((item) => {
              const active = item.label === activeItem
              const hasChildren = !!item.children && item.children.length > 0
              const isExpanded = item.label === expanded
              const itemClass = `flex h-4xl w-full items-center gap-sm rounded-sm px-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-25
                      ${active ? 'bg-primary-600 font-semibold text-text-inverse' : 'text-primary-100 hover:bg-primary-600 hover:text-text-inverse'}`
              return (
                <li key={item.label}>
                  {hasChildren ? (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setExpanded((prev) => (prev === item.label ? '' : item.label))}
                      className={itemClass}
                    >
                      <span aria-hidden>{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <span aria-hidden className="text-primary-200">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                  ) : TOP_ROUTES[item.label] ? (
                    <Link to={TOP_ROUTES[item.label]} aria-current={active ? 'page' : undefined} className={itemClass}>
                      <span aria-hidden>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  ) : (
                    <a href="#" aria-current={active ? 'page' : undefined} className={itemClass}>
                      <span aria-hidden>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                    </a>
                  )}
                  {isExpanded && item.children && item.children.length > 0 && (
                    <ul className="relative grid gap-xxss py-xxss">
                      {/* Ties the expanded options back to their parent — same
                          x as the parent's icon center, spanning every child. */}
                      <span aria-hidden className="absolute top-0 bottom-0 w-px bg-primary-500" style={{ left: 21 }} />
                      {item.children.map((child) => {
                        const childClass = `flex h-4xl items-center rounded-sm pl-4xl pr-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-25
                              ${child === activeChild ? 'text-text-inverse' : 'text-primary-100 hover:text-text-inverse'}`
                        const route = CHILD_ROUTES[child]
                        return (
                          <li key={child}>
                            {route ? (
                              <Link to={route} aria-current={child === activeChild ? 'page' : undefined} className={childClass}>
                                {child}
                              </Link>
                            ) : (
                              <a href="#" aria-current={child === activeChild ? 'page' : undefined} className={childClass}>
                                {child}
                              </a>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Signed-in identity sits at the foot of the nav, not the header. */}
        <div className="shrink-0 border-t border-primary-600 px-base py-base">
          <SidebarProfile />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-lg px-lg py-lg tablet:px-2xl">
          {headerLeft ?? <h1 className="text-2xl font-bold text-text-primary">{title}</h1>}
          {headerActions && <div className="flex flex-wrap items-center gap-sm">{headerActions}</div>}
        </header>
        <main className="min-w-0 flex-1 px-lg pb-2xl tablet:px-2xl">{children}</main>
      </div>
    </div>
  )
}