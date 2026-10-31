import { create } from 'zustand'

/**
 * Who's signed in, for the sidebar profile menu.
 *
 * There is no auth backend — signing out only clears this client flag and
 * swaps the app for the sign-in page. Real sessions must be enforced
 * server-side (docs/SECURITY.md rule 8).
 */
interface SessionState {
  signedIn: boolean
  /** Matches an id in the access store, so the profile shows real roles.
      Kept after sign-out, so the sign-in page can offer the same account. */
  currentUserId: string
  signIn: (userId: string) => void
  signOut: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  signedIn: true,
  currentUserId: 'u-2',
  signIn: (userId) => set({ signedIn: true, currentUserId: userId }),
  signOut: () => set({ signedIn: false }),
}))
