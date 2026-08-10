import type { Meta, StoryObj } from '@storybook/react'
import { Mail, User } from 'lucide-react'

type InputState = 'default' | 'focused' | 'typing' | 'typed' | 'disabled' | 'error'

const STATE_LABELS: Record<InputState, string> = {
  default:  'Default',
  focused:  'Focused',
  typing:   'Typing',
  typed:    'Typed',
  disabled: 'Disable',
  error:    'Error',
}

function FormGroup({ state }: { state: InputState }) {
  const isDisabled = state === 'disabled'
  const isError    = state === 'error'
  const isFocused  = state === 'focused' || state === 'typing'

  const borderClass = isError
    ? 'border-danger'
    : isFocused
    ? 'border-text-primary border-strong'
    : 'border-border-default'

  const opacityClass = isDisabled ? 'opacity-40' : ''

  const valueText =
    state === 'typing' ? 'Type here' :
    state === 'typed'  ? 'Text label' : 'Text label'

  // "Typed" is the only state with a real, committed value — dark text.
  // Everything else (including the "Typing" placeholder) reads as muted.
  const placeholderClass = state === 'typed' ? 'text-text-primary' : 'text-text-muted'

  return (
    <div className={`space-y-xs w-96 ${opacityClass}`}>
      {/* title row */}
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-text-primary">
          Title <span className="text-danger">*</span>
        </span>
        <span className="text-xs text-text-muted">10/10</span>
      </div>
      {/* description */}
      <p className="text-xs text-text-muted">Description</p>
      {/* input */}
      <div className={`flex items-center gap-sm px-base py-sm rounded-sm border bg-neutral-25 shadow-textfield ${borderClass}`}>
        <Mail size={16} className="text-text-muted shrink-0" />
        <span className={`flex-1 text-sm ${placeholderClass}`}>
          {valueText}
          {state === 'typing' && (
            <span className="inline-block w-px h-4 bg-text-primary ml-xxss align-middle" />
          )}
        </span>
        <User size={16} className="text-text-muted shrink-0" />
      </div>
      {/* help / error text */}
      {isError ? (
        <p className="text-xs text-danger">This is error message</p>
      ) : (
        <p className="text-xs text-text-muted">Help Text</p>
      )}
    </div>
  )
}

const STATES: InputState[] = ['default', 'focused', 'typing', 'typed', 'disabled', 'error']

function FormInputSpecimen() {
  return (
    <div className="border border-border-default">
      <div className="bg-neutral-50 border-b border-border-default px-3xl py-2xl">
        <h2 className="text-3xl font-bold text-text-primary">Form Group / Input Fields</h2>
      </div>

      {STATES.map((state, i) => (
        <div
          key={state}
          className={`grid border-b border-border-default last:border-b-0 ${i % 2 === 0 ? 'bg-neutral-50' : 'bg-neutral-25'}`}
          style={{ gridTemplateColumns: '240px 1fr' }}
        >
          <div className="flex items-center justify-center px-2xl py-3xl">
            <span className="text-2xl font-bold text-text-primary">{STATE_LABELS[state]}</span>
          </div>
          <div className="flex items-center px-2xl py-3xl">
            <FormGroup state={state} />
          </div>
        </div>
      ))}
    </div>
  )
}

const meta: Meta<typeof FormInputSpecimen> = {
  title: 'Foundations/Form Input',
  component: FormInputSpecimen,
}
export default meta

type Story = StoryObj<typeof FormInputSpecimen>
export const AllStates: Story = {}
