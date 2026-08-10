import type { Meta, StoryObj } from '@storybook/react'

function LogoSpecimen() {
  return (
    <div className="p-3xl space-y-3xl">
      <h2 className="text-3xl font-bold text-text-primary">Logo</h2>

      {/* Light background */}
      <div className="space-y-sm">
        <p className="text-sm text-text-muted">On light</p>
        <div className="flex items-center justify-center w-96 h-24 bg-neutral-50 rounded-sm border border-border-default">
          <img src="/logo-elisen.svg" alt="Elisen" className="h-8 w-auto" width={600} height={104} />
        </div>
      </div>

      {/* White background */}
      <div className="space-y-sm">
        <p className="text-sm text-text-muted">On white</p>
        <div className="flex items-center justify-center w-96 h-24 bg-neutral-25 rounded-sm border border-border-default">
          <img src="/logo-elisen.svg" alt="Elisen" className="h-8 w-auto" width={600} height={104} />
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof LogoSpecimen> = {
  title: 'Foundations/Logo',
  component: LogoSpecimen,
}
export default meta

type Story = StoryObj<typeof LogoSpecimen>
export const Default: Story = {}
