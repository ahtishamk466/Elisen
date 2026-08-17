import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { useDropdown } from './useDropdown'

export interface ActionsMenuItem {
  label: string
  icon: ReactNode
  onSelect: () => void
  tone?: 'default' | 'danger'
}

export interface ActionsMenuProps {
  items: ActionsMenuItem[]
  ariaLabel: string
}

const MENU_WIDTH = 192

export function ActionsMenu({ items, ariaLabel }: ActionsMenuProps) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
      >
        <MoreVertical size={18} aria-hidden />
      </button>
      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={ariaLabel}
            className="fixed z-dropdown overflow-y-auto rounded-sm border border-border-default bg-neutral-25 py-xs shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className={`flex w-full items-center gap-sm px-lg py-sm text-left text-sm transition-colors duration-fast hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                  ${item.tone === 'danger' ? 'text-danger' : 'text-text-primary'}`}
              >
                <span aria-hidden className={item.tone === 'danger' ? 'text-danger' : 'text-text-muted'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
