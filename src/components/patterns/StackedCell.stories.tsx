import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, userEvent, within } from '@storybook/test'
import { Badge } from '@/components/ui/Badge'
import { StackedCell } from './StackedCell'

/**
 * **THE two-line identifier cell** for list tables. Line 1 is the identifier
 * (14px semibold), line 2 the line that confirms the row (12px, secondary,
 * one line, full text on hover). Projects, Certification Basis, Timesheet and
 * the other lists render their leading cell through this — do not hand-roll it.
 *
 * With `onClick` the whole cell becomes the row's keyboard control: a real
 * `<button>` that stops the click reaching the row. Without it, pass a `Link`
 * as `identifier` or leave it as plain text.
 */
const meta = {
  title: 'Patterns/StackedCell',
  component: StackedCell,
  // A column-wide cell: the width a list table gives its leading column.
  render: (args) => (
    <div className="p-lg">
      <div className="rounded-sm border border-border-default bg-neutral-25 px-base py-base" style={{ width: 280 }}>
        <StackedCell {...args} />
      </div>
    </div>
  ),
  args: { identifier: '4417-02', detail: 'Cabin interior retrofit, structural substantiation', tabularNums: true },
} satisfies Meta<typeof StackedCell>
export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {}

export const WithBadge: Story = {
  args: { trailing: <Badge tone="info">Copy</Badge> },
}

export const WithWarningBadge: Story = {
  args: { identifier: 'DHC-8-402', detail: 'Dash 8 Q400', tabularNums: false, trailing: <Badge tone="warning">2 duplicate sections</Badge> },
}

export const SingleLine: Story = {
  args: { detail: undefined },
}

export const Clickable: Story = {
  args: { onClick: fn(), ariaLabel: 'Open project 4417-02' },
}

export const ClickableHover: Story = {
  args: { onClick: fn(), ariaLabel: 'Open project 4417-02', trailing: <Badge tone="info">Copy</Badge> },
  play: async ({ canvasElement }) => {
    const cell = within(canvasElement).getByRole('button', { name: 'Open project 4417-02' })
    await userEvent.hover(cell)
  },
}

export const ClickableFocus: Story = {
  args: { onClick: fn(), ariaLabel: 'Open project 4417-02', trailing: <Badge tone="info">Copy</Badge> },
  play: async ({ canvasElement, args }) => {
    const cell = within(canvasElement).getByRole('button', { name: 'Open project 4417-02' })
    await userEvent.tab()
    await expect(cell).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}

/** Long text clips to one line each; the full text is on hover and the badge keeps its size. */
export const LongTextTruncated: Story = {
  args: {
    identifier: 'CS-25-AMDT-27-EXTENDED-REFERENCE-4417-02',
    detail: 'Cabin interior retrofit including structural substantiation, flammability testing and certification basis amendments',
    trailing: <Badge tone="info">Copy</Badge>,
    onClick: fn(),
  },
}
