import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { useState } from 'react'
import { SegmentedControl, type SegmentedOption } from './SegmentedControl'

type Status = 'all' | 'active' | 'inactive'

const OPTIONS: SegmentedOption<Status>[] = [
  { value: 'all', label: 'All', count: 657 },
  { value: 'active', label: 'Active', count: 96 },
  { value: 'inactive', label: 'Inactive', count: 561 },
]

/**
 * One choice from a few, all in view — the Certification Basis rules' All /
 * Active / Inactive switch. Native radios: Tab reaches the group once, the
 * arrow keys move the choice. 36px tall, level with a `size="sm"` search.
 */
const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl<Status>,
  args: { ariaLabel: 'Show rules', options: OPTIONS, value: 'all', onChange: () => {} },
  decorators: [(Story) => <div className="p-lg"><Story /></div>],
} satisfies Meta<typeof SegmentedControl<Status>>
export default meta
type Story = StoryObj<typeof meta>

/** The first option selected, counts on every option. */
export const Default: Story = {}

/** Another option selected: the fill and the count pill move with it. */
export const ActiveSelected: Story = { args: { value: 'active' } }

/** Labels only. */
export const WithoutCounts: Story = { args: { options: OPTIONS.map(({ value, label }) => ({ value, label })) } }

/** Disabled: dimmed, not focusable, the choice cannot change. */
export const Disabled: Story = { args: { disabled: true } }

/** Hover an unselected option: a neutral tint, text darkens. */
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByText('Inactive'))
  },
}

/** Tab reaches the selected option once; its focus ring shows. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('radio', { name: /All/ })).toHaveFocus()
  },
}

/** Working: click or use the arrow keys to move the choice. */
export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState<Status>('all')
    return <SegmentedControl {...args} value={value} onChange={setValue} />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Active'))
    await expect(canvas.getByRole('radio', { name: /Active/ })).toBeChecked()
  },
}
