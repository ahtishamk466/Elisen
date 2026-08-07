import type { Meta, StoryObj } from '@storybook/react'
import { CirclePlay, CircleX } from 'lucide-react'
import { Button, type ButtonSize, type ButtonVariant } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
}
export default meta
type Story = StoryObj<typeof Button>

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger']
const SIZES: ButtonSize[] = ['xl', 'lg', 'md', 'sm']

export const AllVariantsAndStates: Story = {
  render: () => (
    <div className="grid gap-2xl p-lg">
      {VARIANTS.map((variant) => (
        <div key={variant} className="grid gap-lg">
          <p className="text-sm font-semibold capitalize text-text-primary">{variant}</p>
          {SIZES.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-lg">
              <Button variant={variant} size={size} leadingIcon={<CirclePlay size={16} />} trailingIcon={<CircleX size={16} />}>
                Button CTA
              </Button>
              <Button variant={variant} size={size} loading>
                Button CTA
              </Button>
              <Button variant={variant} size={size} disabled>
                Button CTA
              </Button>
            </div>
          ))}
        </div>
      ))}
      <p className="text-xs text-text-muted">Hover / focus (Tab) / active states are interactive on the buttons above.</p>
    </div>
  ),
}
