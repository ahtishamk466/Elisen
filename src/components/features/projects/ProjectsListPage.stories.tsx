import type { Meta, StoryObj } from '@storybook/react'
import { ProjectsListPage } from './ProjectsListPage'

const meta: Meta<typeof ProjectsListPage> = {
  title: 'Features/Projects/Projects List',
  component: ProjectsListPage,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof ProjectsListPage>

export const Ready: Story = {}
export const Loading: Story = { args: { state: 'loading' } }
export const Empty: Story = { args: { state: 'empty', rows: [] } }
export const ErrorState: Story = { args: { state: 'error' } }

/** Non-manager role: hours and contract value are hidden. */
export const WithoutFinancials: Story = { args: { canSeeFinancials: false } }
