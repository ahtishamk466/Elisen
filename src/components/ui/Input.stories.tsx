import type { Meta, StoryObj } from '@storybook/react'
import { Mail, User } from 'lucide-react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
}
export default meta
type Story = StoryObj<typeof Input>

export const AllStates: Story = {
  render: () => (
    <div className="grid max-w-96 gap-lg p-lg">
      <Input placeholder="Default" leadingIcon={<Mail size={16} />} trailingIcon={<User size={16} />} />
      <Input defaultValue="Typed value" leadingIcon={<Mail size={16} />} />
      <Input placeholder="Error" error leadingIcon={<Mail size={16} />} />
      <Input placeholder="Disabled" disabled leadingIcon={<Mail size={16} />} />
      <Input type="date" />
      <p className="text-xs text-text-muted">Click into a field for the focused state.</p>
    </div>
  ),
}
