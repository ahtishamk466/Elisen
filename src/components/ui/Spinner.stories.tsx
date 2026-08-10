import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
}
export default meta
type Story = StoryObj<typeof Spinner>

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2xl p-lg">
      <Spinner size={16} />
      <Spinner />
      <Spinner size={32} />
    </div>
  ),
}
