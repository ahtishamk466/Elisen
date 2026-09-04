import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import { usePanelPosition } from './usePanelPosition'
import type { SearchableOption } from './SearchableSelect'

export interface MultiSelectProps {
  id: string
  options: SearchableOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  /** Empty-list copy, e.g. "No approvals recorded yet." */
  emptyLabel?: string
  /** Chips under the field naming each selection. On by default — the count
      alone tells you how many, never which. */
  showChips?: boolean
  disabled?: boolean
  error?: boolean
  /** `sm` (36px) for toolbar rows; `md` (44px) for form fields. */
  size?: 'sm' | 'md'
  /** Lists at or under this length skip the search box — a search field over
      four options is noise. Above it, typing is the only sane way through. */
  searchThreshold?: number
}

/**
 * The multi-select half of the app's one dropdown pattern — checkboxes, a
 * count on the trigger ("3 selected"), and chips underneath naming each
 * choice with an × to drop it.
 *
 * The chips exist because a bare count answers "how many" but never "which",
 * which is the question a user actually has after closing the menu.
 *
 * Pairs with `SearchableSelect` for single choice. Every selection control in
 * the app should be one of the two — never a bespoke dropdown.
 */
export function MultiSelect({
  id, options, value, onChange, placeholder = 'Select…', emptyLabel = 'Nothing to choose from.',
  showChips = true, disabled = false, error = false, searchThreshold = 5, size = 'md',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /** Flips above the trigger and caps its height so it always fits on screen. */
  const position = usePanelPosition(open, triggerRef)

  const selected = options.filter((o) => value.includes(o.value))

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

  // The menu stays open on pick — picking several is the whole point.
  const toggle = (option: SearchableOption) => {
    if (option.disabled) return
    onChange(value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value])
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); return }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? 1 : -1
      for (let i = 1; i <= filtered.length; i += 1) {
        const next = (activeIndex + dir * i + filtered.length * 2) % filtered.length
        if (!filtered[next]?.disabled) { setActiveIndex(next); break }
      }
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const option = filtered[activeIndex]
      if (option) toggle(option)
    }
  }

  return (
    <div className="grid gap-sm">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-invalid={error || undefined}
        onClick={() => setOpen((v) => !v)}
        className={`flex ${size === 'sm' ? 'h-9' : 'h-11'} w-full items-center gap-sm rounded-sm border bg-neutral-25 px-base text-left text-sm shadow-textfield transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
          ${error ? 'border-danger' : 'border-border-default hover:border-text-primary'}
          ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected.length ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <ChevronDown size={16} aria-hidden className="shrink-0 text-text-muted" />
      </button>

      {/* Which, not just how many. */}
      {showChips && selected.length > 0 && (
        <div className="flex flex-wrap gap-xs">
          {selected.map((o) => (
            <span
              key={o.value}
              className="inline-flex max-w-full items-center gap-xs rounded-sm border border-border-default bg-neutral-25 py-xxss pl-sm pr-xxss text-xs text-text-primary"
            >
              <span className="min-w-0 truncate">{o.label}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== o.value))}
                aria-label={`Remove ${o.label}`}
                className="rounded-sm p-xxss text-text-muted transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
              >
                <X size={12} aria-hidden />
              </button>
            </span>
          ))}
          {selected.length > 1 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-sm px-sm py-xxss text-xs font-semibold text-text-primary underline-offset-2 transition-colors duration-fast hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
            >
              Clear all
            </button>
          )}
        </div>
      )}

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
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                placeholder="Type to search…"
              />
            </div>
            )}
            <ul id={`${id}-listbox`} role="listbox" aria-multiselectable className="min-h-0 flex-1 overflow-y-auto py-xs">
              {filtered.length === 0 && (
                <li className="px-base py-sm text-sm text-text-muted">
                  {options.length === 0 ? emptyLabel : 'No matches.'}
                </li>
              )}
              {filtered.map((o, i) => {
                const checked = value.includes(o.value)
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      disabled={o.disabled}
                      onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                      onClick={() => toggle(o)}
                      className={`flex w-full items-start gap-sm px-base py-sm text-left transition-colors duration-fast
                        ${o.disabled ? 'cursor-not-allowed opacity-50' : i === activeIndex ? 'bg-accent-subtle' : ''}`}
                    >
                      {/* Mirrors the Checkbox primitive's box so multi-select
                          reads as multi-select before the menu is even used. */}
                      <span
                        aria-hidden
                        className={`mt-xxss flex h-lg w-lg shrink-0 items-center justify-center rounded-xs border transition-colors duration-fast
                          ${checked ? 'border-primary-700 bg-primary-700' : 'border-border-strong bg-neutral-25'}`}
                      >
                        {checked && (
                          <svg viewBox="0 0 10 8" fill="none" className="w-full p-xxss" stroke="white" strokeWidth={2}>
                            <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-text-primary">{o.label}</span>
                        {(o.disabled ? o.disabledReason : o.hint) && (
                          <span className="block truncate text-xs text-text-muted">
                            {o.disabled ? o.disabledReason : o.hint}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  )
}
