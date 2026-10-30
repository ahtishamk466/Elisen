import { Children, isValidElement, useState, type ReactNode } from 'react'
import { SearchableSelect, type SearchableOption } from './SearchableSelect'

export interface SelectProps {
  id?: string
  value?: string | number
  /** Uncontrolled initial value. Only used when `value` is not supplied. */
  defaultValue?: string | number
  /** Kept event-shaped so the existing `e.target.value` call sites still read
      naturally — there are ~60 of them and none use any other event field. */
  onChange?: (e: { target: { value: string } }) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  className?: string
  /** `sm` (36px) for toolbar rows; `md` (44px) for form fields. */
  size?: 'sm' | 'md'
  'aria-label'?: string
  /** `<option>` elements, exactly as before. */
  children?: ReactNode
}

/** Flattens `<option>` children (including fragments and arrays from `.map`)
    into the option list the standardized dropdown renders. */
/** Flatten an option's children to the text a native <option> would render.
    `String()` on its own is wrong here: JSX gives `<option>{n}-{sub} {t}</option>`
    an *array* of children, and `String(array)` comma-joins it — which showed up
    live as "3200,-,00, ,STC — Cabin Interior Modification". */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

function toOptions(children: ReactNode): SearchableOption[] {
  const out: SearchableOption[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean }
    if (child.type === 'option') {
      out.push({ value: String(props.value ?? ''), label: textOf(props.children), disabled: props.disabled })
    } else {
      // Fragment or wrapper — keep walking so grouped options still register.
      out.push(...toOptions(props.children))
    }
  })
  return out
}

/**
 * Single-choice dropdown. This is a thin adapter over `SearchableSelect` — it
 * keeps the old `<Select><option/></Select>` API so every existing call site
 * gets the standardized dropdown (radio markers, portal rendering, keyboard
 * support, search once the list is long) without being rewritten.
 *
 * For new code prefer `SearchableSelect` directly when you already have an
 * options array, or `MultiSelect` when more than one choice is allowed.
 */
export function Select({
  id, value, defaultValue, onChange, placeholder, error = false, disabled = false, className = '',
  children, size = 'md', 'aria-label': ariaLabel,
}: SelectProps) {
  const options = toOptions(children).filter((o) => o.value !== '' || !placeholder)
  // A custom dropdown has no native uncontrolled mode, so mirror one: when no
  // `value` prop is passed, hold the selection here instead.
  const [internal, setInternal] = useState(String(defaultValue ?? ''))
  const isControlled = value !== undefined
  const current = isControlled ? String(value ?? '') : internal

  return (
    <div className={className}>
      <SearchableSelect
        id={id ?? `select-${ariaLabel ?? 'field'}`}
        options={options}
        value={current}
        onChange={(v) => { if (!isControlled) setInternal(v); onChange?.({ target: { value: v } }) }}
        placeholder={placeholder ?? 'Select…'}
        disabled={disabled}
        error={error}
        indicator="radio"
        size={size}
        ariaLabel={ariaLabel}
      />
    </div>
  )
}
