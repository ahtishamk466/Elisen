import { create } from 'zustand'

/**
 * Who's signed in, for the sidebar profile menu.
 *
 * There is no auth backend — signing out only clears this client flag and
 * swaps the app for a signed-out screen. Real session termination must be
 * enforced server-side (docs/SECURITY.md rule 8).
 */
interface SessionState {
  signedIn: boolean
  /** Matches an id in the access store, so the profile shows real roles. */
  currentUserId: string
  signIn: () => void
  signOut: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  signedIn: true,
  currentUserId: 'u-sysadmin',
  signIn: () => set({ signedIn: true }),
  signOut: () => set({ signedIn: false }),
}))
