import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Clock, ListChecks, ShieldCheck, Users, Settings, ChevronDown, ChevronRight, User, KeyRound } from 'lucide-react'

/** Top-level items without children that have a real screen — rendered as
    router Links; the rest stay inert until their screens exist. */
const TOP_ROUTES: Record<string, string> = {
  'Reports': '/reports',
}

/** Children with real routes render as router Links; the rest stay inert
    until their screens exist. */
const CHILD_ROUTES: Record<string, string> = {
  'Projects List': '/projects',
  'TCCA Projects': '/tcca-projects',
  'Timesheet': '/timesheet',
  'Hours Worked': '/hours-worked',
  'Users': '/admin/users',
  'Roles & Permissions': '/admin/roles',
  'System': '/admin/system',
}

interface NavItem {
  label: string
  icon: ReactNode
  children?: string[]
}

const NAV: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Projects', icon: <FolderOpen size={18} />, children: ['Projects List', 'TCCA Projects'] },
  { label: 'Time Entry', icon: <Clock size={18} />, children: ['Hours Worked', 'Timesheet'] },
  { label: 'Reports', icon: <ListChecks size={18} /> },
  { label: 'GCP', icon: <ShieldCheck size={18} />, children: [] },
  { label: 'User Access Control', icon: <KeyRound size={18} />, children: ['Users', 'Roles & Permissions', 'System'] },
  { label: 'Admin', icon: <Users size={18} />, children: [] },
  { label: 'Settings', icon: <Settings size={18} /> },
]

export interface AppShellProps {
  activeItem?: string
  activeChild?: string
  title: string
  /** Overrides the default `<h1>{title}</h1>` — e.g. a "back to list" link
      instead of repeating a title already shown on the page (Project Detail,
      TCCA Project Detail). */
  headerLeft?: ReactNode
  children: ReactNode
}

export function AppShell({ activeItem = 'Projects', activeChild = 'Projects List', title, headerLeft, children }: AppShellProps) {
  // Expansion is independent of the current route — otherwise a parent
  // section (e.g. Time Entry) can only ever open on pages already inside it,
  // making it look unclickable everywhere else. Defaults to whichever
  // section the current page belongs to, but any parent can be toggled open
  // to browse its children before navigating.
  const [expanded, setExpanded] = useState(activeItem)

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-56 shrink-0 bg-primary-700 laptop:block">
        <div className="px-lg py-xl">
          <img src="/logo-elisen.svg" alt="Elisen" width={600} height={104} className="h-6 w-auto brightness-0 invert" />
        </div>
        <nav aria-label="Main">
          <ul className="grid gap-xxss px-base">
            {NAV.map((item) => {
              const active = item.label === activeItem
              const hasChildren = !!item.children && item.children.length > 0
              const isExpanded = item.label === expanded
              const itemClass = `flex w-full items-center gap-sm rounded-sm px-base py-sm text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-25
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
                    <ul className="grid gap-xxss py-xxss">
                      {item.children.map((child) => {
                        const childClass = `block rounded-sm py-sm pl-4xl pr-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-25
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-lg px-lg py-lg tablet:px-2xl">
          {headerLeft ?? <h1 className="text-2xl font-bold text-text-primary">{title}</h1>}
          <button
            type="button"
            className="inline-flex items-center gap-sm rounded-sm px-base py-sm text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            <User size={18} aria-hidden />
            Admin User
            <ChevronDown size={16} aria-hidden />
          </button>
        </header>
        <main className="min-w-0 flex-1 px-lg pb-2xl tablet:px-2xl">{children}</main>
      </div>
    </div>
  )
}
