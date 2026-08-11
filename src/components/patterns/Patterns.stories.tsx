import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FolderOpen, Plus } from 'lucide-react'
import { FormField } from './FormField'
import { FormSection } from './FormSection'
import { Stepper } from './Stepper'
import { StatCard } from './StatCard'
import { EmptyState } from './EmptyState'
import { Pagination } from './Pagination'
import { AccordionSection } from './AccordionSection'
import { ConfirmDialog } from './ConfirmDialog'
import { Drawer } from './Drawer'
import { DetailCard, DetailField } from './DetailView'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'

const meta: Meta = { title: 'Patterns/Overview' }
export default meta
type Story = StoryObj

/** The standard Edit state: existing data always renders inside a real
    input/textarea, in normal (non-muted) text — never a disabled field,
    which dims real values to the same gray as an empty placeholder. */
export const FormBuildingBlocks: Story = {
  render: () => (
    <div className="grid gap-lg p-lg" style={{ maxWidth: 720 }}>
      <FormSection title="Identification" subtitle="Basic details that identify this project.">
        <FormField label="Project Number" htmlFor="pn-filled" required help="Editing an existing record — the value is real, not a placeholder.">
          <Input id="pn-filled" defaultValue="3200" />
        </FormField>
        <FormField label="Project Number" htmlFor="pn" required help="Next available is 3206.">
          <Input id="pn" placeholder="e.g. 3206" />
        </FormField>
        <FormField label="Title" htmlFor="t" error="Project title is required." counter="0/80">
          <Input id="t" error placeholder="Enter title" />
        </FormField>
      </FormSection>
    </div>
  ),
}

/** The standard View (read-only) state: DetailCard + DetailField, plain
    label-over-value text, no input borders. Use this for every read-only
    screen — never a disabled form input standing in for a view. Empty
    fields show an em dash, so blank is visibly distinct from a real value. */
export const ReadOnlyDetail: Story = {
  render: () => (
    <div className="grid gap-lg p-lg" style={{ maxWidth: 720 }}>
      <DetailCard title="Aircraft">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <DetailField label="Model Number">A320</DetailField>
          <DetailField label="Model Name">Airbus A320</DetailField>
          <DetailField label="Manufacture">Airbus</DetailField>
          <DetailField label="TCCA TC" />
          <DetailField label="Active">Active</DetailField>
        </div>
      </DetailCard>
      <DetailCard title="Editable via header action" onEdit={() => {}}>
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <DetailField label="Company">Air Canada</DetailField>
          <DetailField label="Contact">Remi Rocheleau</DetailField>
        </div>
      </DetailCard>
    </div>
  ),
}

export const StepperStates: Story = {
  render: () => (
    <div className="grid gap-2xl p-lg">
      <Stepper steps={['Basic Info', 'Additional Details']} current={0} />
      <Stepper steps={['Basic Info', 'Additional Details', 'TCCA Setup']} current={1} />
      <Stepper steps={['Basic Info', 'Additional Details', 'TCCA Setup']} current={2} />
    </div>
  ),
}

export const StatsAndEmpty: Story = {
  render: () => (
    <div className="grid gap-lg p-lg">
      <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
        <StatCard value={28} label="Total projects" />
        <StatCard value={19} label="In progress" />
        <StatCard value={8} label="Completed projects" />
        <StatCard value="—" label="Loading example" loading />
      </div>
      <div className="rounded-sm border border-border-default bg-neutral-25">
        <EmptyState
          icon={<FolderOpen size={48} strokeWidth={1.5} />}
          title="No projects yet"
          description="Create your first project to start tracking work packages, deliverables and TCCA approvals."
          action={<Button leadingIcon={<Plus size={16} />}>Add new project</Button>}
        />
      </div>
    </div>
  ),
}

function PaginationDemo() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  return (
    <Pagination
      page={page} pageSize={pageSize} totalItems={781} itemLabel="items"
      onPageChange={setPage} onPageSizeChange={setPageSize}
    />
  )
}
export const PaginationExample: Story = { render: () => <div className="p-lg"><PaginationDemo /></div> }

export const Accordion: Story = {
  render: () => (
    <div className="grid gap-lg p-lg" style={{ maxWidth: 720 }}>
      <AccordionSection title="Application, Cert Basis, MOC, LOI/LOS" meta="2 of 5 applicable">
        <Checkbox label="Major / Minor determination" defaultChecked />
        <Checkbox label="NDWL Project" />
        <Checkbox label="TCCA LOI" defaultChecked />
      </AccordionSection>
      <AccordionSection title="Closing Actions" meta="0 of 4 applicable" defaultOpen={false}>
        <Checkbox label="Upload Docs" />
      </AccordionSection>
    </div>
  ),
}

function OverlayDemo() {
  const [drawer, setDrawer] = useState(false)
  const [danger, setDanger] = useState(false)
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex flex-wrap gap-sm p-lg">
      <Button onClick={() => setDrawer(true)}>Open drawer</Button>
      <Button variant="secondary" onClick={() => setConfirm(true)}>Confirm dialog</Button>
      <Button variant="danger" onClick={() => setDanger(true)}>Destructive dialog</Button>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Drawer title"
        footer={
          <>
            <span />
            <div className="flex gap-sm">
              <Button variant="secondary" onClick={() => setDrawer(false)}>Cancel</Button>
              <Button onClick={() => setDrawer(false)}>Save</Button>
            </div>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Escape closes, Tab is trapped inside, and focus returns to the page behind on close.
        </p>
      </Drawer>

      <ConfirmDialog
        open={confirm}
        title="Mark this work package as complete?"
        description="“Structural Substantiation” will be marked complete. You can reopen it later."
        confirmLabel="Mark as complete"
        onConfirm={() => setConfirm(false)}
        onCancel={() => setConfirm(false)}
      />
      <ConfirmDialog
        open={danger}
        title="Delete this work package?"
        description="“Structural Substantiation” and its activity assignments will be permanently removed. This cannot be undone."
        confirmLabel="Delete work package"
        tone="danger"
        onConfirm={() => setDanger(false)}
        onCancel={() => setDanger(false)}
      />
    </div>
  )
}
export const Overlays: Story = { render: () => <OverlayDemo /> }
