import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { RadioCard } from './RadioCard'

const meta: Meta<typeof RadioCard> = {
  title: 'UI/RadioCard',
  component: RadioCard,
}
export default meta
type Story = StoryObj<typeof RadioCard>

function Demo() {
  const [value, setValue] = useState('yes')
  return (
    <div className="grid grid-cols-2 gap-lg p-lg" style={{ maxWidth: 720 }}>
      <RadioCard
        name="tcca"
        value="yes"
        checked={value === 'yes'}
        onChange={() => setValue('yes')}
        title="Yes, approval is required"
        description="Create a linked TCCA project"
      />
      <RadioCard
        name="tcca"
        value="no"
        checked={value === 'no'}
        onChange={() => setValue('no')}
        title="No approval required"
        description="Customer handles it, or it's not needed"
      />
      <RadioCard name="d" value="d" checked={false} onChange={() => {}} title="Disabled" description="Unavailable option" disabled />
    </div>
  )
}

export const AllStates: Story = { render: () => <Demo /> }
