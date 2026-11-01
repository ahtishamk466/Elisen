import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { MemoryRouter } from 'react-router-dom'
import { BackLink } from './BackLink'

const meta: Meta<typeof BackLink> = {
  title: 'Patterns/BackLink',
  component: BackLink,
  decorators: [(Story) => <MemoryRouter><div className="p-2xl"><Story /></div></MemoryRouter>],
}
export default meta
type Story = StoryObj<typeof BackLink>

const link = <BackLink to="/projects" label="Go back to all projects" />

/** A link with a route: the header of every record page. */
export const Default: Story = { render: () => link }

/** `onClick` instead of `to` renders a button, same pixels. */
export const AsButton: Story = {
  render: () => <BackLink onClick={() => {}} label="Go back to all approvals" />,
}

/** Hover turns the label from text-secondary to text-primary (move the pointer over it). */
export const Hover: Story = {
  render: () => link,
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('link', { name: 'Go back to all projects' }))
  },
}

/** Keyboard focus draws the 2px text-primary ring, offset 2px. */
export const Focus: Story = {
  render: () => link,
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('link', { name: 'Go back to all projects' })).toHaveFocus()
  },
}
