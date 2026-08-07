import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
}
export default meta
type Story = StoryObj<typeof Skeleton>

export const Examples: Story = {
  render: () => (
    <div className="grid max-w-96 gap-lg p-lg">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  ),
}
