import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Clock, ListChecks, ShieldCheck, Database, Settings, ChevronDown, ChevronRight, KeyRound, Award, FileText } from 'lucide-react'
import { SidebarProfile } from './SidebarProfile'

/** Top-level items without children that have a real screen — rendered as
    router Links; the rest stay inert until their screens exist. */
const TOP_ROUTES: Record<string, string> = {
  'Reports': '/reports',
  // One entry each: their two listings are tabs inside the workspace.
  'Approvals': '/approvals',
  'Documents': '/documents/deliverables',
}

/** Children with real routes render as router Links; the rest stay inert
    until their screens exist. */
const CHILD_ROUTES: Record<string, string> = {
  'Projects List': '/projects',
  'Work Packages': '/work-packages',
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
  'Activities & Tasks': '/admin/activities',
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
  // 'Work Packages' hidden from nav at the client's request — not deleted.
  // The route, page and CHILD_ROUTES entry below are untouched, so it comes
  // back by re-adding the label to this children array.
  { label: 'Projects', icon: <FolderOpen size={18} />, children: ['Projects List', 'Projects Review', 'TCCA Projects'] },
  // Approvals and Documents are global records that projects *link to* — a
  // certificate or a drawing outlives any one project and is often shared
  // across several, so they can't be owned by a project. They sit next to
  // Projects because that's where they're used from.
  // One sidebar entry each: the two listings inside them (Approvals /
  // Revisions, Deliverables / Design Data) are tabs of one workspace, the same
  // shape as Aircraft / Serial Numbers. A revision is still a record in its own
  // right with its own listing — it just doesn't need a second nav row to
  // reach it.
  { label: 'Documents', icon: <FileText size={18} /> },
  { label: 'Approvals', icon: <Award size={18} /> },
  { label: 'Time Entry', icon: <Clock size={18} />, children: ['Hours Worked', 'Timesheet'] },
  { label: 'Reports', icon: <ListChecks size={18} /> },
  { label: 'GCP', icon: <ShieldCheck size={18} />, children: [] },
  // Three administrative sections split by *what* they hold, not by who is
  // senior enough to see them: business data staff maintain, access
  // management, and machine-side tooling. Ordered most-used first, and each
  // gated as a whole rather than child-by-child.
  { label: 'Reference Data', icon: <Database size={18} />, children: ['Companies', 'Aircraft', 'Activities & Tasks', 'ATA Chapters'] },
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
  /**
   * One short line under the heading, in the same block as it — **not** a
   * paragraph floated into the page body, where `gap-lg` put 16px of air
   * between a title and the sentence explaining it. Keep it to one clause:
   * what this screen holds, not how it works.
   */
  description?: ReactNode
  headerActions?: ReactNode
  /**
   * Hand the vertical scroll to the page instead of to `<main>`.
   *
   * The default is right for a list page: the page is as tall as its content
   * and `<main>` scrolls it. A master–detail screen wants the opposite — its
   * rail and its detail each scroll inside a frame that ends at the fold — so
   * it opts in here and sizes its own panes with `min-h-0 flex-1`.
   */
  fill?: boolean
  children: ReactNode
}

export function AppShell({ activeItem = 'Projects', activeChild = 'Projects List', title, headerLeft, description, headerActions, fill = false, children }: AppShellProps) {
  // Expansion is independent of the current route — otherwise a parent
  // section (e.g. Time Entry) can only ever open on pages already inside it,
  // making it look unclickable everywhere else. Defaults to whichever
  // section the current page belongs to, but any parent can be toggled open
  // to browse its children before navigating.
  const [expanded, setExpanded] = useState(activeItem)

  return (
    /* The shell owns the viewport: it is exactly one screen tall and never
       scrolls itself, so the sidebar and the page heading stay put and only
       the content below them moves. Scrolling the whole document instead used
       to carry the nav and the title off the top of the screen. */
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Full height of that frame, with the nav list scrolling internally, so
          the profile footer stays above the fold at any scroll position. */}
      <aside className="hidden h-full w-64 shrink-0 flex-col bg-primary-700 laptop:flex">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-lg px-lg py-lg tablet:px-2xl">
          {headerLeft ?? (
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
              {description && <p className="mt-xxss text-sm text-text-secondary">{description}</p>}
            </div>
          )}
          {headerActions && <div className="flex flex-wrap items-center gap-sm">{headerActions}</div>}
        </header>
        <main
          /* `relative` is load-bearing, not decoration: `sr-only` is
             `position: absolute`, and with no positioned ancestor its
             containing block is the document — so a screen-reader label in
             row 50 of a scrolling list sits 2600px down the *page* and gives
             the window a scrollbar the design never asked for. */
          /* `pb-2xl` either way: a `fill` page used to end 16px from the
             window while every scrolling page ended 24px from it, so the two
             kinds of screen sat differently in the same shell for no reason
             a reader could see. Only the scroll model differs now. */
          className={`relative min-h-0 min-w-0 flex-1 px-lg pb-2xl tablet:px-2xl ${
            fill ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}