import type { Meta, StoryObj } from '@storybook/react'

const LEVELS: { name: string; sizeClass: string; size: string; lineHeight: string }[] = [
  { name: 'xs',   sizeClass: 'text-xs',   size: '12px', lineHeight: '16px' },
  { name: 'sm',   sizeClass: 'text-sm',   size: '14px', lineHeight: '20px' },
  { name: 'base', sizeClass: 'text-base', size: '16px', lineHeight: '24px' },
  { name: 'lg',   sizeClass: 'text-lg',   size: '18px', lineHeight: '26px' },
  { name: 'xl',   sizeClass: 'text-xl',   size: '20px', lineHeight: '28px' },
  { name: '2xl',  sizeClass: 'text-2xl',  size: '24px', lineHeight: '32px' },
  { name: '3xl',  sizeClass: 'text-3xl',  size: '32px', lineHeight: '40px' },
  { name: '4xl',  sizeClass: 'text-4xl',  size: '40px', lineHeight: '48px' },
]

const WEIGHTS: { name: string; weightClass: string }[] = [
  { name: 'Regular',  weightClass: 'font-regular' },
  { name: 'Medium',   weightClass: 'font-medium' },
  { name: 'SemiBold', weightClass: 'font-semibold' },
  { name: 'Bold',     weightClass: 'font-bold' },
]

function TypeSpecimen() {
  return (
    <div className="p-3xl space-y-3xl">
      {LEVELS.map((level) => (
        <div key={level.name} className="border-b border-border-default pb-3xl">
          <p className="text-3xl font-bold text-text-primary mb-lg">Text-{level.name}</p>
          <div className="grid grid-cols-4 gap-2xl">
            {WEIGHTS.map((w) => (
              <div key={w.name}>
                <p className="text-sm font-bold text-text-primary mb-sm">{w.name}</p>
                <p className={`${level.sizeClass} ${w.weightClass} text-text-primary mb-xxss`}>
                  Rethink Sans {w.name}
                </p>
                <p className={`${level.sizeClass} ${w.weightClass} text-text-primary mb-sm`}>
                  {level.size} / {level.lineHeight}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const meta: Meta<typeof TypeSpecimen> = {
  title: 'Foundations/Typography',
  component: TypeSpecimen,
}
export default meta

type Story = StoryObj<typeof TypeSpecimen>
export const AllLevels: Story = {}
