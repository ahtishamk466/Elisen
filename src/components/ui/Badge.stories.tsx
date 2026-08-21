import type { Meta, StoryObj } from '@storybook/react'
import { Badge, type BadgeTone } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
}
export default meta
type Story = StoryObj<typeof Badge>

const TONES: BadgeTone[] = ['danger', 'warning', 'info', 'success', 'neutral']

export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-lg p-lg">
      <div className="flex flex-wrap gap-sm">
        {TONES.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-sm">
        {TONES.map((tone) => (
          <Badge key={tone} tone={tone} appearance="outline">
            {tone}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-sm">
        <Badge tone="danger">1 - Fire</Badge>
        <Badge tone="info" appearance="outline">
          Quoted
        </Badge>
        <Badge tone="success" appearance="outline">
          Active
        </Badge>
      </div>
      {/* Both sizes, side by side: `sm` (20px, the default every table uses)
          against `md` (28px, for a card heading beside a 20px title). */}
      <div className="flex flex-wrap items-center gap-sm">
        {TONES.map((tone) => (
          <Badge key={tone} tone={tone} size="md">
            {tone}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-sm">
        <Badge tone="success">On track — sm</Badge>
        <Badge tone="success" size="md">On track — md</Badge>
        <Badge tone="neutral" appearance="outline" size="md">
          Outline — md
        </Badge>
      </div>
    </div>
  ),
}
