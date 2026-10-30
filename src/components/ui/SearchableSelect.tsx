import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'
import { usePanelPosition } from './usePanelPosition'

export interface SearchableOption {
  value: string
  /** Primary line — what the user searches and reads first. */
  label: string
  /** Secondary line, e.g. a company or serial number. Also searched. */
  hint?: string
  disabled?: boolean
  /** Shown in place of the hint when the option can't be picked. */
  disabledReason?: string
}

export interface SearchableSelectProps {
  id: string
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Empty-list copy, e.g. "No aircraft in Reference Data yet." */
  emptyLabel?: string
  disabled?: boolean
  error?: boolean
  /** `sm` (36px) for toolbar rows; `md` (44px) for form fields. */
  size?: 'sm' | 'md'
  /**
   * `field` — a standalone form control, with its own border and height.
   * `bare` — a segment inside an already-bordered control (the dial code in
   * `PhoneInput`): no border, no shadow, fills its container. The open panel
   * is identical either way, which is the point — one dropdown design.
   */
  variant?: 'field' | 'bare'
  /** Floor for the panel width, for triggers too narrow to read the options
      in (a 88px dial-code segment listing "🇦🇪 +971 United Arab Emirates"). */
  menuMinWidth?: number
  /** Labels the trigger when there's no visible <label> pointing at it. */
  ariaLabel?: string
  /** Lists at or under this length skip the search box — a search field over
      four options is noise. Above it, typing is the only sane way through. */
  searchThreshold?: number
  /**
   * How the chosen row is marked.
   * `radio` — a filled radio, for "pick one of these" fields in a form.
   * `check` — a tick, for filters and pickers where the list is a lookup
   * rather than a small fixed set of alternatives.
   */
  indicator?: 'radio' | 'check'
}

/**
 * A select you can type into. Every "attach an existing record" flow uses
 * this — a plain <select> stops being usable once the catalog it points at
 * grows past a couple of dozen rows, which Approvals, Documents and Aircraft
 * all will.
 *
 * Portal-rendered for the same reason ActionsMenu is: these sit inside
 * drawers and overflow containers that would otherwise clip the list.
 */
export function SearchableSelect({
  id, options, value, onChange, placeholder = 'Search and select…', emptyLabel = 'Nothing to choose from.',
  disabled = false, error = false, indicator = 'check', searchThreshold = 5, ariaLabel, size = 'md',
  variant = 'field', menuMinWidth,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /** Flips above the trigger and caps its height so it always fits on screen. */
  const position = usePanelPosition(open, triggerRef, menuMinWidth)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return options
    return options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(q))
  }, [options, query])

  const showSearch = options.length > searchThreshold

  useEffect(() => {
    // Without a search box there's nothing to type into, so the panel itself
    // takes focus — arrow keys and Enter must still work either way.
    if (open) (showSearch ? inputRef.current : panelRef.current)?.focus()
    else { setQuery(''); setActiveIndex(0) }
  }, [open, showSearch])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const pick = (option: SearchableOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); return }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? 1 : -1
      // Step over disabled rows so the highlight never lands somewhere
      // Enter would do nothing.
      for (let i = 1; i <= filtered.length; i += 1) {
        const next = (activeIndex + dir * i + filtered.length * 2) % filtered.length
        if (!filtered[next]?.disabled) { setActiveIndex(next); break }
      }
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const option = filtered[activeIndex]
      if (option) pick(option)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-invalid={error || undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-sm px-base text-left text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
          ${variant === 'bare'
            ? 'h-full bg-transparent'
            : `${size === 'sm' ? 'h-9' : 'h-11'} rounded-sm border bg-neutral-25 shadow-textfield ${error ? 'border-danger' : 'border-border-default hover:border-text-primary'}`}
          ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} aria-hidden className="shrink-0 text-text-muted" />
      </button>

      {open && position &&
        createPortal(
          <div
            ref={panelRef}
            tabIndex={-1}
            onKeyDown={showSearch ? undefined : onKeyDown}
            data-dropdown-panel
            className="fixed z-dropdown flex flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25 shadow-lg outline-none"
            style={position}
          >
            {showSearch && (
            <div className="flex shrink-0 items-center gap-sm border-b border-border-default px-base py-sm">
              <Search size={16} aria-hidden className="shrink-0 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
                onKeyDown={onKeyDown}
                aria-label="Search options"
                aria-controls={`${id}-listbox`}
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                placeholder="Type to search…"
              />
            </div>
            )}
            <ul id={`${id}-listbox`} role="listbox" className="min-h-0 flex-1 overflow-y-auto py-xs">
              {filtered.length === 0 && (
                <li className="px-base py-sm text-sm text-text-muted">
                  {options.length === 0 ? emptyLabel : 'No matches.'}
                </li>
              )}
              {filtered.map((o, i) => (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    disabled={o.disabled}
                    onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                    onClick={() => pick(o)}
                    className={`flex w-full items-start gap-sm px-base py-sm text-left transition-colors duration-fast
                      ${o.disabled ? 'cursor-not-allowed opacity-50' : i === activeIndex ? 'bg-accent-subtle' : ''}`}
                  >
                    {/* A radio in front says "one of these" before the list is
                        even read; a tick after the label suits a lookup, where
                        the options aren't a small set of alternatives. */}
                    {indicator === 'radio' && (
                      <span
                        aria-hidden
                        className={`mt-xxss flex h-lg w-lg shrink-0 items-center justify-center rounded-full border transition-colors duration-fast
                          ${o.value === value ? 'border-primary-700' : 'border-border-strong'}`}
                      >
                        {o.value === value && <span className="h-sm w-sm rounded-full bg-primary-700" />}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-primary">{o.label}</span>
                      {(o.disabled ? o.disabledReason : o.hint) && (
                        <span className="block truncate text-xs text-text-muted">
                          {o.disabled ? o.disabledReason : o.hint}
                        </span>
                      )}
                    </span>
                    {indicator === 'check' && o.value === value && (
                      <Check size={16} aria-hidden className="mt-xxss shrink-0 text-accent" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}
