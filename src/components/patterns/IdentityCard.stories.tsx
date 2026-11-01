import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ActionsMenu } from './ActionsMenu'
import { IdentityCard } from './IdentityCard'
import { Stat } from './Stat'

const actions = (
  <ActionsMenu ariaLabel="Actions for project 26-001-01" items={[
    { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => {} },
    { label: 'Duplicate', icon: <Copy size={16} />, onSelect: () => {} },
    { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => {}, tone: 'danger' },
  ]} />
)

const stats = (
  <dl className="grid gap-lg">
    <Stat dl label="Opened" nowrap>Jul 16, 2026</Stat>
    <Stat dl label="Closed" nowrap />
    <Stat dl label="Linked projects">2</Stat>
  </dl>
)

const meta = {
  title: 'Patterns/IdentityCard',
  component: IdentityCard,
  args: {
    label: 'Project summary',
    title: '26-001-01',
    subtitle: 'Install a satellite communication antenna on the upper fuselage',
    meta: 'Northern Air · Design',
    badges: <><Badge tone="warning" appearance="outline">High</Badge><Badge tone="info" appearance="outline">In progress</Badge></>,
    actions,
    children: stats,
  },
  /* The 320px card column by default; band stories widen the frame. */
  decorators: [(Story, { parameters }) => <div className="p-2xl" style={{ width: parameters.frameWidth ?? 352 }}><Story /></div>],
} satisfies Meta<typeof IdentityCard>
export default meta
type Story = StoryObj<typeof meta>

/** Every slot filled: identifier, subtitle, meta line, badges, ⋮ menu, stats. */
export const Default: Story = {}

/** A tag beside the identifier, e.g. a duplicated record. */
export const WithTitleBadge: Story = { args: { titleBadge: <Badge tone="info">Copy</Badge> } }

/** Only the identifier: optional slots leave no gap or divider behind. */
export const Minimal: Story = {
  args: { subtitle: undefined, meta: undefined, badges: undefined, actions: undefined, children: undefined },
}

/** A long unbroken identifier wraps inside the 320px card instead of widening it. */
export const LongIdentifier: Story = { args: { title: 'A-26-0192-SUPPLEMENTAL-TYPE-CERTIFICATE-AMENDMENT' } }

const bandStats = (
  <dl className="flex flex-wrap gap-x-2xl gap-y-base">
    <Stat dl label="TCDS Number" nowrap>A-177</Stat>
    <Stat dl label="Regulations" nowrap>657</Stat>
    <Stat dl label="Used By" nowrap>8 TCCA projects</Stat>
  </dl>
)
const band = {
  layout: 'band' as const,
  label: 'Certification basis summary',
  title: 'BD-700_A-177_CL',
  subtitle: 'BD-700 TCDS A-177 for Classic (Non GVFD) Aircraft',
  meta: undefined,
  badges: undefined,
  children: bandStats,
}

/** `band`: the full-width variant above the tabs (Certification Basis), stats beside the heading. */
export const Band: Story = { args: band, parameters: { frameWidth: 1100 } }

/** A narrow band: the stats wrap under the heading; the ⋮ menu stays top right. */
export const BandWrapped: Story = { args: band, parameters: { frameWidth: 560 } }

/** Hover the ⋮ trigger: its own hover tint comes from ActionsMenu. */
export const ActionsHover: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button', { name: 'Actions for project 26-001-01' }))
  },
}

/** Tab reaches the ⋮ trigger, the card's only interactive control, with its focus ring. */
export const ActionsFocus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'Actions for project 26-001-01' })).toHaveFocus()
  },
}
