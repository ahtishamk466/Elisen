import type { Meta, StoryObj } from '@storybook/react'

const SPACING: { name: string; widthClass: string }[] = [
  { name: 'xxss (2px)', widthClass: 'w-xxss' },
  { name: 'xs (4px)', widthClass: 'w-xs' },
  { name: 'sm (8px)', widthClass: 'w-sm' },
  { name: 'base (12px)', widthClass: 'w-base' },
  { name: 'lg (16px)', widthClass: 'w-lg' },
  { name: 'xl (20px)', widthClass: 'w-xl' },
  { name: '2xl (24px)', widthClass: 'w-2xl' },
  { name: '3xl (32px)', widthClass: 'w-3xl' },
  { name: '4xl (40px)', widthClass: 'w-4xl' },
  { name: '5xl (48px)', widthClass: 'w-5xl' },
  { name: '6xl (60px)', widthClass: 'w-6xl' },
]

const RADIUS: { name: string; radiusClass: string }[] = [
  { name: 'radius-sm (4px) — all rectangular surfaces', radiusClass: 'rounded-sm' },
  { name: 'radius-full — circular controls only', radiusClass: 'rounded-full' },
]

function SpacingSpecimen() {
  return (
    <div className="p-3xl space-y-3xl">
      <div>
        <p className="text-sm font-semibold text-text-primary mb-lg">Spacing scale (4px grid)</p>
        <div className="space-y-sm">
          {SPACING.map((step) => (
            <div key={step.name} className="flex items-center gap-lg">
              <span className="text-xs text-text-muted w-24">{step.name}</span>
              <div className={`h-lg bg-accent ${step.widthClass}`} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary mb-lg">Border radius</p>
        <div className="flex gap-lg">
          {RADIUS.map((r) => (
            <div key={r.name} className="text-center">
              <div className={`w-16 h-16 bg-accent-subtle border border-accent ${r.radiusClass}`} />
              <p className="text-xs text-text-muted mt-sm">{r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof SpacingSpecimen> = {
  title: 'Foundations/Spacing & Radius',
  component: SpacingSpecimen,
}
export default meta

type Story = StoryObj<typeof SpacingSpecimen>
export const AllSteps: Story = {}
