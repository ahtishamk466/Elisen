import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
}
export default meta
type Story = StoryObj<typeof Select>

const options = (
  <>
    <option value="internal">Internal</option>
    <option value="preferred">Preferred</option>
    <option value="external">External</option>
  </>
)

export const AllStates: Story = {
  render: () => (
    <div className="grid max-w-96 gap-lg p-lg">
      <Select placeholder="Select a type..." defaultValue="">
        {options}
      </Select>
      <Select defaultValue="internal">{options}</Select>
      <Select placeholder="Error" defaultValue="" error>
        {options}
      </Select>
      <Select placeholder="Disabled" defaultValue="" disabled>
        {options}
      </Select>
    </div>
  ),
}

/** Same rule as `Input`: `sm` (36px) in toolbar rows, `md` (44px, default) for
    stacked form fields. See UI/Input → Sizes for the reasoning. */
export const Sizes: Story = {
  render: () => (
    <div className="grid max-w-96 gap-lg p-lg">
      <div className="grid gap-xs">
        <p className="text-xs font-semibold text-text-secondary">sm, 36px</p>
        <Select size="sm" placeholder="Any type" defaultValue="">{options}</Select>
      </div>
      <div className="grid gap-xs">
        <p className="text-xs font-semibold text-text-secondary">md, 44px (default)</p>
        <Select placeholder="Any type" defaultValue="">{options}</Select>
      </div>
    </div>
  ),
}
