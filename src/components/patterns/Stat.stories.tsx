import type { Meta, StoryObj } from '@storybook/react'
import { Stat } from './Stat'

const meta: Meta<typeof Stat> = {
  title: 'Patterns/Stat',
  component: Stat,
}
export default meta
type Story = StoryObj<typeof Stat>

/**
 * The client-fixed spec, stated once where every variant can be checked
 * against it: label 12px / regular / Neutral 500, value 14px / semibold /
 * Neutral 950, 2px between them. Every stat in the app renders through
 * this component — do not hand-roll the pair.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-2xl p-lg">
      {/* Plain grid (detail cards — the Project Overview "Dates" card shape) */}
      <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-3">
        <Stat label="Project opened date">Jul 16, 2026</Stat>
        <Stat label="Due date">Feb 19, 2026</Stat>
        <Stat label="Company Number" nowrap>001</Stat>
        <Stat label="Aircraft Input Date" />
        <Stat label="Closed Date">{''}</Stat>
      </div>

      {/* Inside a <dl>, with the divided-strip layout owned by the caller */}
      <dl className="flex flex-wrap items-stretch">
        {['Work packages', 'Activities', 'Not started'].map((label, i) => (
          <div key={label} className="border-l border-border-default px-2xl first:border-l-0 first:pl-0">
            <Stat dl label={label}>{i * 3}</Stat>
          </div>
        ))}
        <div className="border-l border-border-default px-2xl">
          <Stat dl label="Overtime" hint="Worked beyond regular hours. No budget covers it.">15h</Stat>
        </div>
      </dl>

      {/* Empty value renders an em dash — visibly blank, never invisible */}
      <div className="grid gap-lg mobile:grid-cols-2">
        <Stat label="Banked" hint="Hover for the definition" />
        <Stat label="Serial No" nowrap>MSN 4471-A</Stat>
      </div>
    </div>
  ),
}
