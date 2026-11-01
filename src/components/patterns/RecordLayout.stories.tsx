import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '@/components/ui/Badge'
import { IdentityCard } from './IdentityCard'
import { RecordLayout } from './RecordLayout'
import { SectionTabs } from './SectionTabs'
import { Stat } from './Stat'

const TABS = ['Overview', 'Projects', 'Documents'] as const
type Tab = (typeof TABS)[number]

function Example() {
  const [tab, setTab] = useState<Tab>('Overview')
  return (
    <RecordLayout identity={
      <IdentityCard label="TCCA project summary" title="A-26-0192" subtitle="Satcom antenna installation, Dash 8-400"
        badges={<Badge tone="info">In progress</Badge>}>
        <dl className="grid gap-lg">
          <Stat dl label="Opened" nowrap>Jul 16, 2026</Stat>
          <Stat dl label="Linked projects">1</Stat>
        </dl>
      </IdentityCard>
    }>
      <SectionTabs tabs={TABS} active={tab} onChange={setTab} ariaLabel="TCCA sections" counts={{ Projects: 1 }} />
      <section aria-label={tab} className="rounded-sm border border-border-default bg-neutral-25 p-lg">
        <p className="text-sm text-text-secondary">{tab} content. The identity card stays beside every tab.</p>
      </section>
    </RecordLayout>
  )
}

const meta = {
  title: 'Patterns/RecordLayout',
  component: RecordLayout,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="p-2xl"><Story /></div>],
} satisfies Meta<typeof RecordLayout>
export default meta
type Story = StoryObj<typeof meta>

/** Laptop and up: 320px card beside the tabs. Switch tabs; the card never moves. */
export const Default: Story = {
  args: { identity: null, children: null },
  render: () => <Example />,
}

/** Below laptop the card stacks above the tabs. */
export const Stacked: Story = {
  args: { identity: null, children: null },
  render: () => <Example />,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
