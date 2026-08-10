import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './Textarea'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
}
export default meta
type Story = StoryObj<typeof Textarea>

export const AllStates: Story = {
  render: () => (
    <div className="grid max-w-96 gap-lg p-lg">
      <Textarea placeholder="Default" />
      <Textarea defaultValue="Typed value" />
      <Textarea placeholder="Error" error />
      <Textarea placeholder="Disabled" disabled />
    </div>
  ),
}
