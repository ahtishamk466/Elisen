import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Clock, ListChecks, ShieldCheck, Database, Settings, ChevronDown, ChevronRight, KeyRound, Award, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { SidebarProfile } from './SidebarProfile'
import { useUiStore } from '@/stores/uiStore'

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
  'GCP Projects': '/gcp/flow',
  'Regulations': '/gcp/regulations',
  'Cert Basis': '/gcp/cert-bases',
  'People & Authority': '/gcp/people',
  'Reference Lists': '/gcp/reference',
  'GCP Reports': '/gcp/reports',
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
  // GCP's 23 legacy screens collapse into five: the project workspace where the
  // daily work happens, and four library sections it reads from.
  { label: 'GCP', icon: <ShieldCheck size={18} />, children: ['GCP Projects', 'Regulations', 'Cert Basis', 'People & Authority', 'Reference Lists', 'GCP Reports'] },
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

  /* Collapsed state lives in a store, not in this component: every page
     mounts its own AppShell, so `useState` here would reset the rail back
     to full width on every navigation (client instruction, 2026-09-25 —
     "clicking again should restore the full navigation panel", which has to
     survive moving between screens to mean anything). */
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const expandSidebar = useUiStore((s) => s.expandSidebar)

  /** Collapsed, a parent section has nowhere to show its children, so
      picking one opens the rail and that section together rather than
      appearing to do nothing. */
  const openSection = (label: string) => {
    if (collapsed) { expandSidebar(); setExpanded(label); return }
    setExpanded((prev) => (prev === label ? '' : label))
  }

  return (
    /* The shell owns the viewport: it is exactly one screen tall and never
       scrolls itself, so the sidebar and the page heading stay put and only
       the content below them moves. Scrolling the whole document instead used
       to carry the nav and the title off the top of the screen. */
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Full height of that frame, with the nav list scrolling internally, so
          the profile footer stays above the fold at any scroll position.

          Width is the only thing that changes between states — 256px open,
          64px collapsed (client instruction, 2026-09-25). `<main>` beside it
          is already `flex-1 min-w-0`, so every page reclaims the 192px
          without a single page-level change: the transition is on the aside,
          and the content reflows against it. */}
      <aside
        className={`hidden h-full shrink-0 flex-col bg-primary-700 transition-[width] duration-base tablet:flex ${
          collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Logo and toggle share the header row; collapsed, the toggle is all
            that's left and it centers in the rail. The logo is hidden rather
            than swapped for a mark — there is one lockup (docs/DESIGN.md,
            "Brand"), and 64px of rail has no room for it beside the control. */}
        <div className={`flex items-center py-xl ${collapsed ? 'justify-center px-sm' : 'justify-between px-lg'}`}>
          {!collapsed && (
            <img src="/logo-elisen.svg" alt="Elisen" width={600} height={104} className="h-6 w-auto brightness-0 invert" />
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-primary-100 transition-colors duration-fast hover:bg-primary-600 hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-25"
          >
            {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
          </button>
        </div>
        {/* No visible scrollbar in the sidebar (client instruction,
            2026-09-24) — it still scrolls (wheel, keyboard), it just never
            shows the bar the rest of the app's scroll regions do. */}
        <nav id="app-sidebar-nav" aria-label="Main" className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
          <ul className={`grid gap-xxss ${collapsed ? 'px-sm' : 'px-base'}`}>
            {NAV.map((item) => {
              const active = item.label === activeItem
              const hasChildren = !!item.children && item.children.length > 0
              const isExpanded = !collapsed && item.label === expanded
              /* Collapsed, the row is a centred icon with no padding to push
                 it off-centre, and the label moves onto `title`/`aria-label`
                 so the item still has an accessible name (CLAUDE.md rule 6)
                 and still says what it is on hover. */
              const itemClass = `flex h-4xl w-full items-center rounded-sm text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-25
                      ${collapsed ? 'justify-center px-0' : 'gap-sm px-base'}
                      ${active ? 'bg-primary-600 font-semibold text-text-inverse' : 'text-primary-100 hover:bg-primary-600 hover:text-text-inverse'}`
              const collapsedLabel = collapsed ? { title: item.label, 'aria-label': item.label } : {}
              return (
                <li key={item.label}>
                  {hasChildren ? (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => openSection(item.label)}
                      className={itemClass}
                      {...collapsedLabel}
                    >
                      <span aria-hidden>{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <span aria-hidden className="text-primary-200">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        </>
                      )}
                    </button>
                  ) : TOP_ROUTES[item.label] ? (
                    <Link to={TOP_ROUTES[item.label]} aria-current={active ? 'page' : undefined} className={itemClass} {...collapsedLabel}>
                      <span aria-hidden>{item.icon}</span>
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                    </Link>
                  ) : (
                    <a href="#" aria-current={active ? 'page' : undefined} className={itemClass} {...collapsedLabel}>
                      <span aria-hidden>{item.icon}</span>
                      {!collapsed && <span className="flex-1">{item.label}</span>}
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
        <div className={`shrink-0 border-t border-primary-600 py-base ${collapsed ? 'px-sm' : 'px-base'}`}>
          <SidebarProfile collapsed={collapsed} />
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
          /* `overflow-x-hidden`, not just `overflow-y-auto`: a wide table's
             own scroll container still leaks its content width into this
             element's `scrollWidth` (verified live — `contain: paint` on the
             table's scroller was the only other thing that cleared it), so
             `main` became sideways-scrollable by a few dozen pixels and the
             whole page — heading and all — could be dragged left off its
             gutter, revealing dead space. `main` scrolls vertically and
             nothing else; every wide table already scrolls inside its own
             `overflow-x-auto` (client instruction, 2026-09-25: no awkward
             empty gaps in either sidebar state). */
          className={`relative min-h-0 min-w-0 flex-1 px-lg pb-2xl tablet:px-2xl ${
            fill ? 'flex flex-col overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}