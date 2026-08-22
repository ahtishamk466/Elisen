import type { Meta, StoryObj } from '@storybook/react'
import { Badge, type BadgeTone } from './Badge'

/**
 * **THE tag.** Status, Active, health, priority, count chips — every tag in
 * the app is a `Badge`, never a hand-rolled span, which is what keeps two
 * tags sitting side by side from drifting to different sizes and weights.
 *
 * **Global rules, fixed:**
 * - **4px corner radius** (`radius-xs`) on every tag, every tone, every
 *   size — not the 8px other rectangular surfaces use. See docs/DESIGN.md
 *   → "Tags".
 * - `sm` (default) — 12px, medium: the table/row badge.
 * - `md` — 12px, semibold, roomier padding: the card-heading status tag.
 *
 * Both sizes are 12px on purpose: a tag beside another tag must never be a
 * different text size, and `md` differs only in weight and padding.
 */
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
          against `md` (24px, 12px semibold, the card-heading status tag). */}
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
