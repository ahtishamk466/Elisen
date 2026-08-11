import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronUp, LogOut, User, UserCircle } from 'lucide-react'
import { useDropdown } from './useDropdown'
import { Drawer } from './Drawer'
import { ConfirmDialog } from './ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useSessionStore } from '@/stores/sessionStore'
import { useAccessStore } from '@/stores/accessStore'
import { effectivePermissionIds, groupByModule, moduleLabel } from '@/lib/accessDisplay'

const MENU_WIDTH = 200

/**
 * Signed-in identity at the foot of the sidebar, with Profile and Logout.
 *
 * Lives in patterns/ alongside AppShell because it's app chrome, not a
 * reusable primitive — same reason AppShell hardcodes this app's nav and
 * routes. See docs/DECISIONS.md.
 */
export function SidebarProfile() {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)

  const currentUserId = useSessionStore((s) => s.currentUserId)
  const signOut = useSessionStore((s) => s.signOut)
  const users = useAccessStore((s) => s.users)
  const roles = useAccessStore((s) => s.roles)

  const user = users.find((u) => u.id === currentUserId)
  const displayName = user?.username ?? 'Admin User'
  const effective = user ? effectivePermissionIds(user, roles) : []

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
            className="fixed z-dropdown rounded-sm border border-border-default bg-neutral-25 py-xs shadow-lg"
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); setProfileOpen(true) }}
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

      {profileOpen && (
        <Drawer
          open
          onClose={() => setProfileOpen(false)}
          title={`Profile — ${displayName}`}
          footer={<Button variant="secondary" onClick={() => setProfileOpen(false)}>Close</Button>}
        >
          <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
            <h2 className="text-lg font-bold text-text-primary">Account</h2>
            <div className="mt-lg grid grid-cols-2 gap-lg">
              <div>
                <p className="text-xs text-text-muted">Username</p>
                <p className="mt-xxss text-sm text-text-primary">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Email</p>
                <p className="mt-xxss text-sm text-text-primary">{user?.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Status</p>
                <p className="mt-xxss">
                  <Badge tone={user?.status === 'inactive' ? 'neutral' : 'success'} dot>
                    {user?.status === 'inactive' ? 'Inactive' : 'Active'}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Roles</p>
                <div className="mt-xxss flex flex-wrap gap-xs">
                  {user?.roleIds.length
                    ? user.roleIds.map((id) => (
                        <Badge key={id} appearance="outline">{roles.find((r) => r.id === id)?.name ?? id}</Badge>
                      ))
                    : <span className="text-sm text-text-muted">—</span>}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
            <h2 className="text-lg font-bold text-text-primary">Your access</h2>
            <p className="mt-xxss text-xs text-text-muted">
              Everything your roles grant, including inherited permissions. Managed under User Access Control.
            </p>
            <div className="mt-lg grid gap-base">
              {effective.length === 0 && <p className="text-sm text-text-muted">No permissions.</p>}
              {groupByModule(effective).map(([module, ids]) => (
                <div key={module}>
                  <p className="text-xs font-semibold text-text-secondary">{moduleLabel(module)} · {ids.length}</p>
                  <div className="mt-xs flex flex-wrap gap-xs">
                    {ids.map((id) => (
                      <span key={id} className="rounded-sm bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">{id}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Drawer>
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
