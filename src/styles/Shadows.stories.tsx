import type { Meta, StoryObj } from '@storybook/react'

function ShadowCard({
  label,
  cssValue,
  shadowClass,
  dark,
}: {
  label: string
  cssValue: string
  shadowClass: string
  dark?: boolean
}) {
  return (
    <div className={`flex flex-col items-start gap-sm p-2xl rounded-sm ${dark ? 'bg-neutral-200' : 'bg-neutral-100'}`}>
      <div className={`w-56 h-32 bg-neutral-25 rounded-sm flex items-center justify-center ${shadowClass}`}>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className="text-xs text-text-muted font-mono">box-shadow: {cssValue}</p>
    </div>
  )
}

function ShadowsSpecimen() {
  return (
    <div className="p-3xl space-y-3xl">
      <h2 className="text-3xl font-bold text-text-primary">Drop Shadows</h2>

      <div className="flex flex-wrap gap-2xl">
        <ShadowCard
          label="Dropshadow_Button"
          cssValue="3px 3px 4px 0 rgba(255,255,255,0.20)"
          shadowClass="shadow-button"
          dark
        />
        <ShadowCard
          label="DropdShadow_Textfield"
          cssValue="0 1px 2px 0 var(--Primitive-Neutral-50, #F8FAFC)"
          shadowClass="shadow-textfield"
        />
        <ShadowCard
          label="shadow-sm"
          cssValue="0 1px 2px 0 rgba(2,6,23,0.06)"
          shadowClass="shadow-sm"
        />
        <ShadowCard
          label="shadow-md"
          cssValue="0 4px 8px 0 rgba(2,6,23,0.08)"
          shadowClass="shadow-md"
        />
        <ShadowCard
          label="shadow-lg"
          cssValue="0 8px 16px 0 rgba(2,6,23,0.10)"
          shadowClass="shadow-lg"
        />
      </div>
    </div>
  )
}

const meta: Meta<typeof ShadowsSpecimen> = {
  title: 'Foundations/Shadows',
  component: ShadowsSpecimen,
}
export default meta

type Story = StoryObj<typeof ShadowsSpecimen>
export const AllShadows: Story = {}
