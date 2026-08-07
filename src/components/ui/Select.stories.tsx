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
