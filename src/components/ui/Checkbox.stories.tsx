import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
}
export default meta
type Story = StoryObj<typeof Checkbox>

export const AllStates: Story = {
  render: () => (
    <div className="grid gap-lg p-lg">
      <Checkbox label="Label" />
      <Checkbox label="Label" defaultChecked />
      <Checkbox label="Label" requiredMark />
      <Checkbox label="Label" requiredMark defaultChecked />
      <Checkbox label="Label" disabled />
      <Checkbox label="Label" disabled defaultChecked />
      <p className="text-xs text-text-muted">Tab onto a checkbox for the focused ring.</p>
    </div>
  ),
}
