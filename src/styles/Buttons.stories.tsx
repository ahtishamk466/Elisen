import type { Meta, StoryObj } from '@storybook/react'
import { CirclePlay, CircleX, LoaderCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'tertiary'
type BtnSize = 'xl' | 'lg' | 'md' | 'sm'
type BtnState = 'default' | 'focused' | 'hover' | 'pressed' | 'loading' | 'disabled'

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE: Record<BtnSize, { btn: string; icon: number; label: string }> = {
  xl: { btn: 'h-14 px-xl gap-sm text-base font-semibold', icon: 18, label: 'X Large' },
  lg: { btn: 'h-11 px-lg gap-sm text-sm  font-semibold', icon: 16, label: 'Large'   },
  md: { btn: 'h-9  px-base gap-xs text-sm  font-semibold', icon: 15, label: 'Medium' },
  sm: { btn: 'h-7  px-sm  gap-xs text-xs  font-semibold', icon: 13, label: 'Small'  },
}

// ─── Style map ────────────────────────────────────────────────────────────────

// Every state shares the same radius token (rounded-sm) so corners never
// look inconsistent across the state/variant grid.
const RADIUS = 'rounded-sm'

// Focus ring: solid, not dashed — offset outline in text-primary so it
// reads as a clean ring on every variant, including transparent tertiary.
const FOCUS_RING = 'outline outline-2 outline-offset-2 outline-text-primary'

function getClass(variant: Variant, state: BtnState): string {
  if (variant === 'primary') {
    const base = `${RADIUS} border border-primary-900 bg-primary-900 text-text-inverse`
    switch (state) {
      case 'default':  return base
      case 'focused':  return `${base} ${FOCUS_RING}`
      case 'hover':    return `${RADIUS} border border-primary-800 bg-primary-800 text-text-inverse`
      case 'pressed':  return `${RADIUS} border border-primary-950 bg-primary-950 text-text-inverse`
      case 'loading':  return `${base} cursor-wait`
      case 'disabled': return `${RADIUS} border border-neutral-200 bg-neutral-100 text-text-muted cursor-not-allowed`
    }
  }

  if (variant === 'secondary') {
    const base = `${RADIUS} border border-border-strong bg-transparent text-text-primary`
    switch (state) {
      case 'default':  return base
      case 'focused':  return `${base} ${FOCUS_RING}`
      case 'hover':    return `${RADIUS} border-[2px] border-text-primary bg-transparent text-text-primary`
      case 'pressed':  return `${RADIUS} border border-border-strong bg-accent-subtle text-text-primary`
      case 'loading':  return `${base} cursor-wait`
      case 'disabled': return `${RADIUS} border border-neutral-200 bg-transparent text-neutral-300 cursor-not-allowed`
    }
  }

  // tertiary
  const base = `${RADIUS} border border-transparent bg-transparent text-text-primary`
  switch (state) {
    case 'default':  return base
    case 'focused':  return `${RADIUS} border border-transparent bg-transparent text-accent underline underline-offset-2 ${FOCUS_RING}`
    case 'hover':    return `${RADIUS} border border-transparent bg-transparent text-accent underline underline-offset-2`
    case 'pressed':  return `${RADIUS} border border-transparent bg-transparent text-primary-700 underline underline-offset-2`
    case 'loading':  return `${base} cursor-wait`
    case 'disabled': return `${RADIUS} border border-transparent bg-transparent text-neutral-300 cursor-not-allowed`
  }
}

// ─── Single button specimen ────────────────────────────────────────────────────

function Btn({ variant, size, state }: { variant: Variant; size: BtnSize; state: BtnState }) {
  const { btn, icon } = SIZE[size]
  const isLoading = state === 'loading'

  const iconClass =
    variant === 'primary' && state !== 'disabled'
      ? 'text-text-inverse'
      : variant === 'secondary' && state === 'disabled'
      ? 'text-neutral-300'
      : variant === 'tertiary' && (state === 'focused' || state === 'hover')
      ? 'text-accent'
      : variant === 'tertiary' && state === 'pressed'
      ? 'text-primary-700'
      : variant === 'tertiary' && state === 'disabled'
      ? 'text-neutral-300'
      : 'text-current'

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap ${btn} ${getClass(variant, state)}`}
      disabled={state === 'disabled'}
      tabIndex={-1}
      type="button"
    >
      {isLoading
        ? <LoaderCircle size={icon} className={`${iconClass} animate-spin`} />
        : <CirclePlay  size={icon} className={iconClass} />
      }
      <span>Button CTA</span>
      {isLoading
        ? <LoaderCircle size={icon} className={`${iconClass} animate-spin`} />
        : <CircleX     size={icon} className={iconClass} />
      }
    </button>
  )
}

// ─── Specimen table ───────────────────────────────────────────────────────────

const VARIANTS: Variant[] = ['primary', 'secondary', 'tertiary']
const VARIANT_LABELS: Record<Variant, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
}
const SIZES: BtnSize[] = ['xl', 'lg', 'md', 'sm']
const STATES: BtnState[] = ['default', 'focused', 'hover', 'pressed', 'loading', 'disabled']
const STATE_LABELS: Record<BtnState, string> = {
  default: 'Default', focused: 'Focused', hover: 'Hover',
  pressed: 'Pressed', loading: 'Loading', disabled: 'Disabled',
}

function ButtonsSpecimen() {
  return (
    <div className="p-3xl">
      <h2 className="text-3xl font-bold text-text-primary mb-3xl">Buttons</h2>

      <div className="overflow-x-auto">
        <table className="border-collapse w-full" style={{ minWidth: 900 }}>
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left text-sm font-semibold text-text-primary pb-lg pr-2xl w-36">
                Button Type
              </th>
              {STATES.map((s) => (
                <th key={s} className="text-left text-sm font-semibold text-text-primary pb-lg px-sm">
                  {STATE_LABELS[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((variant, vi) => (
              <>
                {/* Variant section header row */}
                <tr key={`${variant}-header`} className={vi > 0 ? 'border-t border-border-default' : ''}>
                  <td className="pt-xl pb-sm">
                    <span className="text-lg font-bold text-text-primary">{VARIANT_LABELS[variant]}</span>
                  </td>
                  {STATES.map((s) => <td key={s} />)}
                </tr>

                {/* Size rows */}
                {SIZES.map((size) => (
                  <tr key={`${variant}-${size}`}>
                    <td className="text-sm text-text-secondary pr-2xl py-sm align-middle">
                      {SIZE[size].label}
                    </td>
                    {STATES.map((state) => (
                      <td key={state} className="px-sm py-sm align-middle">
                        <Btn variant={variant} size={size} state={state} />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const meta: Meta<typeof ButtonsSpecimen> = {
  title: 'Foundations/Buttons',
  component: ButtonsSpecimen,
}
export default meta

type Story = StoryObj<typeof ButtonsSpecimen>
export const AllVariants: Story = {}
