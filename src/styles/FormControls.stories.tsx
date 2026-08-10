import type { Meta, StoryObj } from '@storybook/react'

// ─── Shared types ───────────────────────────────────────────────────────────

type ColumnKind = 'default' | 'disabled' | 'focused'

interface ControlProps {
  checked: boolean
  disabled: boolean
  focused: boolean
  required?: boolean
}

const COLUMNS: { kind: ColumnKind; label: string }[] = [
  { kind: 'default',  label: 'Default'  },
  { kind: 'disabled', label: 'Disabled' },
  { kind: 'focused',  label: 'Focused'  },
]

function propsFor(kind: ColumnKind, checked: boolean, required?: boolean): ControlProps {
  return {
    checked,
    required,
    disabled: kind === 'disabled',
    focused: kind === 'focused',
  }
}

// ─── Checkbox ────────────────────────────────────────────────────────────────
// Box radius is explicitly radius-sm (4px) per spec.

function Checkbox({ checked, disabled, focused, required }: ControlProps) {
  const opacity = disabled ? 'opacity-40' : ''
  const focusRing = focused ? 'outline outline-2 outline-offset-2 outline-text-primary' : ''

  return (
    <label className={`inline-flex items-center gap-xs cursor-pointer select-none ${opacity}`}>
      <span
        className={`w-lg h-lg rounded-sm border flex items-center justify-center shrink-0 ${focusRing}
          ${checked ? 'bg-primary-900 border-primary-900' : 'bg-neutral-25 border-border-strong'}`}
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
      >
        {checked && (
          <svg viewBox="0 0 10 8" fill="none" className="w-full p-xxss" stroke="white" strokeWidth={2}>
            <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-base text-text-primary">
        Label{required && <span className="text-danger">*</span>}
      </span>
    </label>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
// Track stays a pill (radius-full) — 4px applies to square controls only.

function Toggle({ checked, disabled, focused, required }: ControlProps) {
  const opacity = disabled ? 'opacity-40' : ''
  const focusRing = focused ? 'outline outline-2 outline-offset-2 outline-text-primary' : ''

  return (
    <label className={`inline-flex items-center gap-xs cursor-pointer select-none ${opacity}`}>
      <span
        className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors shrink-0 ${focusRing}
          ${checked ? 'bg-primary-900' : 'bg-neutral-300'}`}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
      >
        <span
          className={`absolute w-4 h-4 rounded-full bg-neutral-25 shadow-sm transition-transform
            ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </span>
      <span className="text-base text-text-primary">
        Label{required && <span className="text-danger">*</span>}
      </span>
    </label>
  )
}

// ─── Radio ───────────────────────────────────────────────────────────────────
// Circle stays radius-full — 4px applies to square controls only.

function Radio({ checked, disabled, focused, required }: ControlProps) {
  const opacity = disabled ? 'opacity-40' : ''
  const focusRing = focused ? 'outline outline-2 outline-offset-2 outline-text-primary' : ''

  return (
    <label className={`inline-flex items-center gap-xs cursor-pointer select-none ${opacity}`}>
      <span
        className={`w-lg h-lg rounded-full border flex items-center justify-center shrink-0 ${focusRing}
          ${checked ? 'border-primary-900' : 'border-border-strong bg-neutral-25'}`}
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled}
      >
        {checked && <span className="w-sm h-sm rounded-full bg-primary-900" />}
      </span>
      <span className="text-base text-text-primary">
        Label{required && <span className="text-danger">*</span>}
      </span>
    </label>
  )
}

// ─── Specimen grid: 3 columns (Default / Disabled / Focused) × 4 rows ─────────
// Rows: unchecked, checked, unchecked+required, checked+required = 12 variants

function ControlGrid({
  title,
  renderControl,
}: {
  title: string
  renderControl: (props: ControlProps) => React.ReactNode
}) {
  const ROWS: { checked: boolean; required?: boolean }[] = [
    { checked: false },
    { checked: true },
    { checked: false, required: true },
    { checked: true,  required: true },
  ]

  return (
    <div className="space-y-lg">
      <p className="text-2xl font-bold text-text-primary">{title}</p>

      <div className="inline-grid gap-x-3xl gap-y-2xl border border-border-default rounded-sm p-2xl"
        style={{ gridTemplateColumns: 'repeat(3, auto)' }}>
        {COLUMNS.map((col) => (
          <p key={col.kind} className="text-sm font-semibold text-text-muted">{col.label}</p>
        ))}

        {ROWS.map((row) =>
          COLUMNS.map((col) => (
            <div key={`${col.kind}-${row.checked}-${row.required}`}>
              {renderControl(propsFor(col.kind, row.checked, row.required))}
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-text-muted">12 Variants</p>
    </div>
  )
}

function FormControlsSpecimen() {
  return (
    <div className="p-3xl space-y-3xl">
      <ControlGrid title="Checkbox" renderControl={(p) => <Checkbox {...p} />} />
      <ControlGrid title="Toggle"   renderControl={(p) => <Toggle {...p} />} />
      <ControlGrid title="Radio"    renderControl={(p) => <Radio {...p} />} />
    </div>
  )
}

const meta: Meta<typeof FormControlsSpecimen> = {
  title: 'Foundations/Form Controls',
  component: FormControlsSpecimen,
}
export default meta

type Story = StoryObj<typeof FormControlsSpecimen>
export const CheckboxToggleRadio: Story = {}
