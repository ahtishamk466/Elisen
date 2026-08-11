import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { PhoneInput } from './PhoneInput'

const meta: Meta<typeof PhoneInput> = {
  title: 'UI/PhoneInput',
  component: PhoneInput,
}
export default meta
type Story = StoryObj<typeof PhoneInput>

function InteractiveDemo() {
  const [countryCode, setCountryCode] = useState('')
  const [number, setNumber] = useState('')
  return <PhoneInput id="demo-phone" countryCode={countryCode} onCountryCodeChange={setCountryCode} number={number} onNumberChange={setNumber} />
}

export const AllStates: Story = {
  render: () => (
    <div className="grid max-w-96 gap-lg p-lg">
      <div>
        <p className="mb-xs text-xs text-text-muted">Default (interactive)</p>
        <InteractiveDemo />
      </div>
      <div>
        <p className="mb-xs text-xs text-text-muted">Filled — flag + dial code, fills its container like any other field</p>
        <PhoneInput id="filled-phone" countryCode="+65" onCountryCodeChange={() => {}} number="000-000-00" onNumberChange={() => {}} />
      </div>
      <div>
        <p className="mb-xs text-xs text-text-muted">Error</p>
        <PhoneInput id="error-phone" countryCode="" onCountryCodeChange={() => {}} number="" onNumberChange={() => {}} error />
      </div>
      <div>
        <p className="mb-xs text-xs text-text-muted">Disabled</p>
        <PhoneInput id="disabled-phone" countryCode="+1" onCountryCodeChange={() => {}} number="(201) 555-0123" onNumberChange={() => {}} disabled />
      </div>
    </div>
  ),
}
