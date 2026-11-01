import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'
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
      <Alert tone="warning" title="2 rules appear more than once">
        A basis applies each rule at one amendment. 23.1: 23-34, 23-10, IR · 23.2: 23-36, 23-32
      </Alert>
      <Alert tone="info" title="A TCCA project can be added later">
        Use the TCCA tab on the project once approval is confirmed.
      </Alert>
    </div>
  ),
}

const fixes = <>
  <Button variant="secondary" size="sm">Show Duplicates</Button>
  <Button variant="secondary" size="sm">Keep Latest Version</Button>
</>

/** With `actions`: the buttons sit beside the text when there is room. */
export const WithActions: Story = {
  render: () => (
    <div className="p-lg" style={{ maxWidth: 1000 }}>
      <Alert tone="warning" title="2 rules appear more than once (23.1, 23.2)" actions={fixes}>
        A basis applies each rule at one amendment. 23.1: 23-34, 23-10, IR · 23.2: 23-36, 23-32
      </Alert>
    </div>
  ),
}

/** Narrow: the buttons move under the text instead of squeezing it. */
export const WithActionsNarrow: Story = {
  render: () => (
    <div className="p-lg" style={{ maxWidth: 420 }}>
      <Alert tone="warning" title="2 rules appear more than once (23.1, 23.2)" actions={fixes}>
        A basis applies each rule at one amendment. 23.1: 23-34, 23-10, IR · 23.2: 23-36, 23-32
      </Alert>
    </div>
  ),
}
