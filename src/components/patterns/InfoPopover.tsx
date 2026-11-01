import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { layoutRect } from '@/components/ui/usePanelPosition'
import { useDropdown } from './useDropdown'

export interface InfoPopoverProps {
  title: string
  summary: string
  children: ReactNode
}

const CARD_WIDTH = 440
const MARGIN = 8
const MIN_ANCHORED_SPACE = 160
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]'

function focusableWithin(root: ParentNode) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) =>
    element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[inert], [aria-hidden="true"]')
      && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden',
  )
}

/** Click-open, nonmodal guidance. Hover never opens it and focus is not trapped. */
export function InfoPopover({ title, summary, children }: InfoPopoverProps) {
  const id = useId()
  const panelId = `${id}-info`
  const titleId = `${id}-title`
  const summaryId = `${id}-summary`
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null)
  const width = viewport ? Math.min(CARD_WIDTH, Math.max(0, viewport.width - MARGIN * 2)) : CARD_WIDTH
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(width)
  const focusedOnOpen = useRef(false)

  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      if (!triggerRef.current) return
      const rect = layoutRect(triggerRef.current)
      setViewport({ width: rect.viewportWidth, height: rect.viewportHeight })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open, triggerRef])

  useLayoutEffect(() => {
    if (!open) { focusedOnOpen.current = false; return }
    if (position && viewport && menuRef.current && !focusedOnOpen.current) {
      focusedOnOpen.current = true
      menuRef.current.focus({ preventScroll: true })
    }
  }, [open, position, viewport, menuRef])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
    } else if (event.key === 'Tab' && menuRef.current?.contains(document.activeElement)) {
      const inside = focusableWithin(menuRef.current)
      const current = document.activeElement
      const leavingBackwards = event.shiftKey && (current === menuRef.current || current === inside[0])
      const leavingForwards = !event.shiftKey && (current === inside[inside.length - 1] || inside.length === 0)
      if (!leavingBackwards && !leavingForwards) return
      event.preventDefault()
      const pageControls = focusableWithin(document).filter((element) => !menuRef.current?.contains(element))
      const next = leavingBackwards ? triggerRef.current : pageControls[pageControls.indexOf(triggerRef.current!) + 1]
      setOpen(false)
      const target = next ?? triggerRef.current
      target?.focus({ preventScroll: true })
    }
  }

  // useDropdown chooses the anchor. Locally remove its minimum-height floor
  // and clamp width; short viewports use the available viewport instead.
  const edge = Math.max(MARGIN, position?.top ?? position?.bottom ?? MARGIN)
  const available = viewport ? viewport.height - edge - MARGIN : 0
  const anchored = available >= MIN_ANCHORED_SPACE
  const placement = position && viewport ? {
    ...(anchored ? position.top !== undefined ? { top: edge } : { bottom: edge } : { top: MARGIN }),
    left: Math.max(MARGIN, Math.min(position.left, viewport.width - width - MARGIN)),
    width,
    maxHeight: Math.max(0, anchored ? available : viewport.height - MARGIN * 2),
  } : null

  return (
    <>
      <Button ref={triggerRef} type="button" variant="tertiary" size="sm"
        aria-label={`About ${title}`} aria-haspopup="dialog" aria-expanded={open}
        aria-controls={open ? panelId : undefined} onKeyDown={onKeyDown}
        onMouseDown={(event) => { if (open) event.preventDefault() }}
        onClick={() => { if (open) close(); else setOpen(true) }}
        leadingIcon={<Info size={18} aria-hidden />} />
      {open && placement && createPortal(
        <div ref={menuRef} id={panelId} role="dialog" tabIndex={-1}
          aria-labelledby={titleId} aria-describedby={summaryId} onKeyDown={onKeyDown}
          onBlur={(event) => {
            const next = event.relatedTarget
            if (next instanceof Node && menuRef.current?.contains(next)) return
            setOpen(false)
          }}
          className="fixed z-dropdown flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-strong bg-neutral-25 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          style={placement}>
          <div className="flex shrink-0 items-start gap-base border-b border-border-default bg-neutral-50 px-xl py-xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-accent" aria-hidden>
              <Info size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="break-words text-base font-semibold text-text-primary">{title}</h2>
              <p id={summaryId} className="mt-xs text-sm text-text-secondary">{summary}</p>
            </div>
            <Button type="button" variant="tertiary" size="sm" aria-label="Close information"
              onClick={close} leadingIcon={<X size={16} aria-hidden />} />
          </div>
          <div role="region" aria-label={`${title} details`} tabIndex={0}
            className="grid min-h-0 gap-lg overflow-y-auto px-xl py-xl text-sm text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary">{children}</div>
        </div>, document.body,
      )}
    </>
  )
}
