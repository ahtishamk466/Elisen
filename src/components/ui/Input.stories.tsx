import type { Meta, StoryObj } from '@storybook/react'
import { Mail, Search, User } from 'lucide-react'
import { Button } from './Button'
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

/**
 * Two heights, and the choice is not cosmetic:
 * - `sm` (36px) for anything sitting in a **toolbar row** next to a button —
 *   page-header search, an inline "field + Attach" row. Buttons are 36px, so
 *   a 44px field beside one reads as a misalignment bug.
 * - `md` (44px, default) for **stacked form fields** inside a form or drawer,
 *   where the extra height is the comfortable tap target and nothing sits
 *   beside it to disagree with.
 */
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-2xl p-lg">
      <div className="grid gap-sm">
        <p className="text-xs font-semibold text-text-secondary">sm, 36px, matches a button in a toolbar row</p>
        <div className="flex items-center gap-sm">
          <div className="min-w-0 flex-1">
            <label htmlFor="in-sm" className="sr-only">Search</label>
            <Input id="in-sm" size="sm" placeholder="Search..." leadingIcon={<Search size={16} />} />
          </div>
          <Button>Register</Button>
        </div>
      </div>
      <div className="grid gap-sm">
        <p className="text-xs font-semibold text-text-secondary">md, 44px, default, for stacked form fields</p>
        <label htmlFor="in-md" className="text-sm font-semibold text-text-primary">Model No</label>
        <Input id="in-md" placeholder="e.g. RV-14A" />
      </div>
    </div>
  ),
}
