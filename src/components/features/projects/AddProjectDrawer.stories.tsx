import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/Button'
import { AddProjectDrawer } from './AddProjectDrawer'

const meta: Meta<typeof AddProjectDrawer> = {
  title: 'Features/Projects/Add Project Drawer',
  component: AddProjectDrawer,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof AddProjectDrawer>

function Demo({ canSeeFinancials = true }: { canSeeFinancials?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="min-h-screen bg-neutral-50 p-2xl">
      <Button onClick={() => setOpen(true)}>Add new project</Button>
      <AddProjectDrawer open={open} onClose={() => setOpen(false)} canSeeFinancials={canSeeFinancials} />
    </div>
  )
}

/**
 * Walk the flow: Continue with empty fields shows validation, choosing
 * "Yes, approval is required" adds the third TCCA step, and closing with
 * unsaved changes raises the discard dialog.
 */
export const Default: Story = { render: () => <Demo /> }

/** Non-manager role: the Financial section is not rendered. */
export const WithoutFinancials: Story = { render: () => <Demo canSeeFinancials={false} /> }
