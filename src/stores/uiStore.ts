import { create } from 'zustand'

/**
 * Chrome state that has to outlive a route change.
 *
 * The sidebar's collapsed/expanded state can't be `useState` inside
 * `AppShell`: every page renders its own `AppShell`, so component state is
 * torn down and rebuilt on every navigation and the sidebar would spring
 * back open the moment you clicked a nav item. It belongs to the app, not
 * to a page, so it lives here.
 *
 * Not persisted — same as every other store in this prototype, state resets
 * on reload (docs/COMPONENTS.md, "The data is the client's own").
 */
interface UiState {
  /** Sidebar reduced to its icon rail. */
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  /** Used by the collapsed rail: a parent section can only show its children
      once the sidebar is open again, so picking one does both at once. */
  expandSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  expandSidebar: () => set({ sidebarCollapsed: false }),
}))
