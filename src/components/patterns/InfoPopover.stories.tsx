import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, waitFor, within } from '@storybook/test'
import { Button } from '@/components/ui/Button'
import { InfoPopover } from './InfoPopover'

const details = (
  <dl className="grid gap-lg">
    <div>
      <dt className="font-semibold text-text-primary">What you can manage</dt>
      <dd className="mt-xs">Rule coverage for each FOC specialist, with the saved limitation and active status.</dd>
    </div>
    <div>
      <dt className="font-semibold text-text-primary">Where it is used</dt>
      <dd className="mt-xs">Identify delegated specialists when planning compliance. Coverage follows the Section Root independently of a rule’s amendment.</dd>
    </div>
  </dl>
)

const meta = {
  title: 'Patterns/InfoPopover',
  component: InfoPopover,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Specialist Coverage', summary: 'Rules each specialist is authorised to cover.', children: details },
  render: (args) => (
    <div className="flex items-center justify-end gap-lg p-2xl">
      <InfoPopover {...args} />
      <Button variant="secondary">Next control</Button>
    </div>
  ),
} satisfies Meta<typeof InfoPopover>
export default meta
type Story = StoryObj<typeof meta>

export const ClickAndKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    const trigger = canvas.getByRole('button', { name: 'About Specialist Coverage' })
    const next = canvas.getByRole('button', { name: 'Next control' })

    await userEvent.hover(trigger)
    await expect(page.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(trigger)
    const dialog = await page.findByRole('dialog', { name: 'Specialist Coverage' })
    await expect(dialog).toHaveFocus()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(within(dialog).getByText('What you can manage')).toBeVisible()
    await expect(within(dialog).getAllByRole('button')).toHaveLength(1)

    await userEvent.keyboard('{Escape}')
    await expect(page.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()

    await userEvent.click(trigger)
    await userEvent.click(await page.findByRole('button', { name: 'Close information' }))
    await expect(trigger).toHaveFocus()
    await expect(page.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    await page.findByRole('dialog', { name: 'Specialist Coverage' })
    await userEvent.tab()
    await expect(page.getByRole('button', { name: 'Close information' })).toHaveFocus()
    await userEvent.tab()
    await expect(page.getByRole('region', { name: 'Specialist Coverage details' })).toHaveFocus()
    await userEvent.tab()
    await expect(page.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(next).toHaveFocus()

    await userEvent.click(trigger)
    await page.findByRole('dialog', { name: 'Specialist Coverage' })
    await userEvent.tab({ shift: true })
    await expect(page.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()

    await userEvent.click(trigger)
    await page.findByRole('dialog', { name: 'Specialist Coverage' })
    await userEvent.click(next)
    await expect(next).toHaveFocus()
    await expect(page.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    await page.findByRole('dialog', { name: 'Specialist Coverage' })
    next.focus()
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument())
    await expect(next).toHaveFocus()
  },
}

export const LongContent: Story = {
  args: {
    children: <div className="grid gap-lg">{Array.from({ length: 12 }, (_, index) => (
      <section key={index}>
        <h3 className="font-semibold text-text-primary">Guidance section {index + 1}</h3>
        <p className="mt-xs">Detailed guidance stays inside the scrolling body. The title and Close control remain above it, and focus can leave the card normally.</p>
      </section>
    ))}</div>,
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'About Specialist Coverage' }))
  },
}

export const BottomEdge: Story = {
  render: (args) => <div className="flex min-h-viewport items-end justify-end p-lg"><InfoPopover {...args} /></div>,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'About Specialist Coverage' }))
  },
}

export const NarrowViewport: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'About Specialist Coverage' }))
  },
}
