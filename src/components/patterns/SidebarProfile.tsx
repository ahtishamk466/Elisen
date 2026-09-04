import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, LogOut, User, UserCircle } from 'lucide-react'
import { useDropdown } from './useDropdown'
import { ConfirmDialog } from './ConfirmDialog'
import { useSessionStore } from '@/stores/sessionStore'
import { useAccessStore } from '@/stores/accessStore'

const MENU_WIDTH = 200

/**
 * Signed-in identity at the foot of the sidebar, with Profile and Logout.
 * Profile navigates to /profile — the account details and Change Password
 * live there, not in a drawer, so the page is linkable and matches the
 * legacy app's standalone screen.
 *
 * Lives in patterns/ alongside AppShell because it's app chrome, not a
 * reusable primitive — same reason AppShell hardcodes this app's nav and
 * routes. See docs/DECISIONS.md.
 */
export function SidebarProfile() {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)
  const [confirmOut, setConfirmOut] = useState(false)
  const navigate = useNavigate()

  const currentUserId = useSessionStore((s) => s.currentUserId)
  const signOut = useSessionStore((s) => s.signOut)
  const users = useAccessStore((s) => s.users)

  const displayName = users.find((u) => u.id === currentUserId)?.username ?? 'Admin User'

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-sm rounded-sm px-base py-sm text-sm text-primary-100 transition-colors duration-fast hover:bg-primary-600 hover:text-text-inverse focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-25"
      >
        <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-text-inverse">
          <User size={16} />
        </span>
        <span className="min-w-0 flex-1 truncate text-left">{displayName}</span>
        <ChevronUp size={16} aria-hidden className={`shrink-0 transition-transform duration-fast ${open ? '' : 'rotate-180'}`} />
      </button>

      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Account"
            className="fixed z-dropdown overflow-y-auto rounded-sm border border-border-default bg-neutral-25 py-xs shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); navigate('/profile') }}
              className="flex w-full items-center gap-sm px-lg py-sm text-left text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
            >
              <span aria-hidden className="text-text-muted"><UserCircle size={16} /></span>
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); setConfirmOut(true) }}
              className="flex w-full items-center gap-sm px-lg py-sm text-left text-sm text-danger transition-colors duration-fast hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
            >
              <span aria-hidden className="text-danger"><LogOut size={16} /></span>
              Logout
            </button>
          </div>,
          document.body,
        )}

      <ConfirmDialog
        open={confirmOut}
        title="Log out of Elisen?"
        description="You'll be returned to the sign-in screen. Any unsaved changes on this page will be lost."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        tone="danger"
        onConfirm={() => { setConfirmOut(false); signOut() }}
        onCancel={() => setConfirmOut(false)}
      />
    </>
  )
}
