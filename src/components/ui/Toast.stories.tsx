import type { Meta, StoryObj } from '@storybook/react'
import { Toast } from './Toast'

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
}
export default meta
type Story = StoryObj<typeof Toast>

/** The two tones this app actually fires — nearly every confirmation is
    `success` (the default); `danger` is for a failed action. Real usage
    always goes through `ToastViewport` (which positions, times out and
    stacks these); this story is just the static shell. */
export const AllTones: Story = {
  render: () => (
    <div className="grid gap-lg p-lg" style={{ maxWidth: 480 }}>
      <Toast title="“3322-00” duplicated." onDismiss={() => {}} />
      <Toast tone="danger" title="Couldn't save — try again." onDismiss={() => {}} />
    </div>
  ),
}

/**
 * THE wording for every duplicate/copy action in the app, verbatim —
 * `"${record}" duplicated.`, quoting the record's own number/name, nothing
 * else. Copy an entry point from here rather than writing a new phrasing:
 * `ProjectsListPage` (`"3322-00" duplicated.`), `FlowStepProject`'s TCCA
 * project duplicate, and any future "Duplicate" action all use this exact
 * shape. `TimesheetListPage`/`HoursWorkedPage` shorten it to a fixed noun
 * ("Entry duplicated.") since there's no natural short label to quote for a
 * timesheet row — same verb, same period, no quotes.
 */
export const DuplicateConfirmation: Story = {
  render: () => (
    <div className="p-lg">
      <Toast title="“3322-00” duplicated." onDismiss={() => {}} />
    </div>
  ),
}
