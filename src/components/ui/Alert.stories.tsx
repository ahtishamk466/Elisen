import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
}
export default meta
type Story = StoryObj<typeof Alert>

export const AllTones: Story = {
  render: () => (
    <div className="grid gap-lg p-lg" style={{ maxWidth: 720 }}>
      <Alert title="Please complete the required fields">
        Fill in all fields marked with an asterisk (*) before continuing.
      </Alert>
      <Alert tone="info" title="A TCCA project can be added later">
        Use the TCCA tab on the project once approval is confirmed.
      </Alert>
    </div>
  ),
}
