import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ChevronDown, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { FormField } from './FormField'
import { FormSection } from './FormSection'
import { Stepper } from './Stepper'
import { StatCard } from './StatCard'
import { EmptyState } from './EmptyState'
import { Pagination } from './Pagination'
import { TableTabs } from './TableTabs'
import { FileDropzone } from './FileDropzone'
import { BarChart } from './BarChart'
import { AccordionSection } from './AccordionSection'
import { ConfirmDialog } from './ConfirmDialog'
import { Drawer } from './Drawer'
import { DetailCard, DetailField } from './DetailView'
import { Truncate } from './Truncate'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { PhoneInput } from '@/components/ui/PhoneInput'

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
    fields show an em dash, so blank is visibly distinct from a real value.
    Short codes (Serial No, Reg. No, Model No, IDs) always pass `nowrap` —
    a wrapped code reads as broken, never truncate/clamp one. */
export const ReadOnlyDetail: Story = {
  render: () => (
    <div className="grid gap-lg p-lg" style={{ maxWidth: 720 }}>
      <DetailCard title="Aircraft">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <DetailField label="Serial No" nowrap>9033</DetailField>
          <DetailField label="Reg. No" nowrap>M-YGJL</DetailField>
          <DetailField label="Model Number" nowrap>A320</DetailField>
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

const PAGINATION_ROW_HEADERS = ['No. / Type', 'Project', 'Company Name', 'Contact Name', 'Person Res.', 'Hours (Act/Bud)', 'Priority', 'Status', 'Actions']

/** Pagination is a table's footer, not a second card below it — always
    render it as the last child inside the same bordered wrapper as the
    table, sharing one border/corner-radius. Never give it its own box. */
function PaginationDemo() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  return (
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" style={{ minWidth: 900 }}>
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {PAGINATION_ROW_HEADERS.map((h) => (
                <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-default last:border-b-0">
              <td className="whitespace-nowrap px-lg py-base">
                <p className="text-sm font-semibold text-text-primary">3200-00</p>
                <p className="text-xs text-text-muted">Internal</p>
              </td>
              <td className="px-lg py-base text-sm text-text-primary">STC — Cabin Interior Modification, Cert Program</td>
              <td className="whitespace-nowrap px-lg py-base">
                <p className="text-sm text-text-primary">Northwind Aerospace</p>
                <p className="text-xs text-text-muted">246</p>
              </td>
              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">Nathalie Gagnon</td>
              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">Sofia Reyes</td>
              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">44 / 80h</td>
              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">2 – High</td>
              <td className="whitespace-nowrap px-lg py-base"><Badge>On Hold</Badge></td>
              <td className="px-lg py-base text-text-secondary">⋮</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        page={page} pageSize={pageSize} totalItems={781} itemLabel="items"
        onPageChange={setPage} onPageSizeChange={setPageSize}
      />
    </div>
  )
}
export const PaginationExample: Story = { render: () => <div className="p-lg"><PaginationDemo /></div> }

/** Tabs belong to the table, not above it: they render as the first child of
    the same bordered card, and the active tab's accent underline sits on the
    card's dividing line so the selection joins the rows below. Counts stay
    beside each label. Never render them as standalone pills floating over
    the table. Arrow keys move between tabs (real ARIA tabs); the strip
    scrolls when the tabs outgrow a narrow viewport. */
function TableTabsDemo() {
  const [active, setActive] = useState('priorities')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  return (
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <TableTabs
        ariaLabel="Review presets"
        activeKey={active}
        onChange={setActive}
        tabs={[
          { key: 'all', label: 'All', count: 45 },
          { key: 'priorities', label: 'Priorities', count: 26 },
          { key: 'outstanding', label: 'Outstanding RFQs', count: 6 },
          { key: 'completed', label: 'Completed RFQs', count: 12 },
          { key: 'internal', label: 'Internal', count: 6 },
        ]}
      />
      <div className="overflow-x-auto" role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0}>
        <table className="w-full border-collapse text-left" style={{ minWidth: 700 }}>
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {['Number', 'Company Name', 'Priority', 'Status'].map((h) => (
                <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-default last:border-b-0">
              <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">3292-00</td>
              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">A.I.M.S.</td>
              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">1 – Fire</td>
              <td className="whitespace-nowrap px-lg py-base"><Badge tone="warning">In Progress</Badge></td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        page={page} pageSize={pageSize} totalItems={26} itemLabel="projects"
        onPageChange={setPage} onPageSizeChange={setPageSize}
      />
    </div>
  )
}
export const TableTabsExample: Story = { render: () => <div className="p-lg"><TableTabsDemo /></div> }

/** THE file picker for the whole app — every upload uses this, never a bare
    `<input type="file">` and never a FormField/FormSection wrapper around it.
    It carries its own label, hint, selected-file row and error message, so
    drop it straight into a drawer or page. The "Upload File" button inside
    the zone is the real keyboard-reachable control; dropping a file, or
    clicking anywhere in the zone, are conveniences on top of it. */
function FileDropzoneDemo() {
  const [file, setFile] = useState<File | null>(null)
  return (
    <div className="grid gap-3xl">
      <FileDropzone
        label="Upload File" required accept=".sql" hint="SQL backup files only (.sql)"
        file={file} onSelect={setFile}
      />
      <FileDropzone
        label="Upload File" required accept=".sql" hint="SQL backup files only (.sql)"
        file={null} onSelect={() => {}} error="Choose a .sql backup file to upload."
      />
    </div>
  )
}
export const FileDropzoneExample: Story = { render: () => <div className="p-lg"><FileDropzoneDemo /></div> }

/** One series per chart, always. A second measure means a second scale, so it
    goes in its own chart beside this one — never a second y-axis. The axis is
    built from a round step (0/2,000/4,000/6,000), bars are thin with a 2px
    gap and a 4px rounded top anchored to the baseline, gridlines stay
    recessive, and an all-zero series says so instead of drawing an empty
    plot. `tone="danger"` is only for series that *are* a fault count, so the
    color repeats what the title already said. Every chart carries an
    sr-only data table — values never depend on reading a bar height. */
export const BarChartExample: Story = {
  render: () => (
    <div className="grid gap-2xl p-lg">
      <BarChart
        caption="Entries per day"
        data={[
          { label: 'Thu, Aug 06', value: 820 }, { label: 'Fri, Aug 07', value: 1450 },
          { label: 'Sat, Aug 08', value: 2380 }, { label: 'Sun, Aug 09', value: 5210 },
          { label: 'Mon, Aug 10', value: 3140 }, { label: 'Tue, Aug 11', value: 260 },
          { label: 'Wed, Aug 12', value: 180 },
        ]}
        format={(v) => v.toLocaleString('en-CA')}
      />
      <BarChart
        caption="Errors per day"
        tone="danger"
        height={140}
        data={[
          { label: 'Mon', value: 2100 }, { label: 'Tue', value: 1500 }, { label: 'Wed', value: 9500 },
          { label: 'Thu', value: 3400 }, { label: 'Fri', value: 800 },
        ]}
        format={(v) => v.toLocaleString('en-CA')}
      />
      <BarChart caption="Mails per day" height={140} data={[{ label: 'Mon', value: 0 }, { label: 'Tue', value: 0 }]} emptyLabel="No mails in the last 7 days" />
    </div>
  ),
}

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

/** The standard for any table cell that can hold long free text (titles,
    descriptions, comments, model names): clip at 2 lines instead of
    stretching the whole row, full text on hover via the native title
    tooltip. Never let one long cell blow out every row's height. */
export const TruncatedTableText: Story = {
  render: () => (
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25" style={{ maxWidth: 900 }}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            <th scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">Serial No</th>
            <th scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">Reg. No</th>
            <th scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">Model Number</th>
            <th scope="col" className="px-lg py-base text-sm font-semibold text-text-secondary">Model Name</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border-default last:border-b-0">
            {/* Short codes: whitespace-nowrap, never truncate/clamp — a
                wrapped serial or registration reads as broken data. */}
            <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">9033</td>
            <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">M-YGJL</td>
            <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">Astra SPX</td>
            {/* Long free text: line-clamp-2 + title tooltip via Truncate. */}
            <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 260 }}>
              <Truncate>Israel Aircraft Astra SPX / Gulfsream 100 — Long-Range Variant, Extended Cabin Configuration</Truncate>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
}

const EDIT_ENTRIES = [
  { id: 'e1', name: 'Remi Rocheleau' },
  { id: 'e2', name: 'Louise Flornoy' },
]

/**
 * THE standard Edit screen. Every edit drawer in the app looks like this —
 * Companies, Aircraft, Projects, Work Packages, all of them:
 *
 *  - Fields are ALWAYS stacked `FormField` rows (label left, control right),
 *    never a horizontal table of bare inputs with column headers.
 *  - Repeated children (contacts, serials, aircraft) are collapsible entries
 *    inside their own `FormSection`: chevron + entry name as the toggle,
 *    trash on the right, divider between entries, "+ Add Another X" last.
 *  - Footer is exactly Cancel (secondary) + Save Changes (primary).
 *  - Every control is full width so the whole form shares one right edge.
 *
 * A multi-step Stepper is for CREATING a record only — never for editing.
 */
export const StandardEditScreen: Story = {
  render: () => (
    <div className="grid gap-lg p-lg" style={{ maxWidth: 720 }}>
      <FormSection title="Company" subtitle="The record's own fields, one stacked FormField each.">
        <FormField label="Name" htmlFor="std-name" required>
          <Input id="std-name" defaultValue="Air Canada" />
        </FormField>
        <FormField label="City" htmlFor="std-city">
          <Input id="std-city" defaultValue="Dorval" />
        </FormField>
        <FormField label="Phone No" htmlFor="std-phone">
          <PhoneInput id="std-phone" countryCode="+1" onCountryCodeChange={() => {}} number="514-555-0142" onNumberChange={() => {}} />
        </FormField>
        <Checkbox label="Active — available in pickers across the app" defaultChecked />
      </FormSection>

      <FormSection title="Contacts" subtitle="Repeated children: collapsible entries, never a horizontal row of bare inputs.">
        {EDIT_ENTRIES.map((e, i) => (
          <div key={e.id} className={i > 0 ? 'border-t border-border-default pt-lg' : ''}>
            <div className="flex items-center justify-between gap-lg">
              <button
                type="button"
                aria-expanded
                className="flex items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
              >
                <span aria-hidden className="text-text-muted"><ChevronDown size={16} /></span>
                {e.name}
              </button>
              <button
                type="button"
                aria-label={`Remove ${e.name}`}
                className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
            <div className="mt-lg grid gap-lg">
              <FormField label="Full Name" htmlFor={`std-ct-${e.id}`}>
                <Input id={`std-ct-${e.id}`} defaultValue={e.name} />
              </FormField>
              <FormField label="Status" htmlFor={`std-st-${e.id}`}>
                <Select id={`std-st-${e.id}`} defaultValue="active">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormField>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex w-fit items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <Plus size={16} aria-hidden /> Add Another Contact
        </button>
      </FormSection>

      <div className="flex justify-end gap-sm border-t border-border-default pt-lg">
        <Button variant="secondary">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  ),
}
