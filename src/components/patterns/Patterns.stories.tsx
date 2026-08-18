import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ChevronDown, Filter as FilterIcon, FolderOpen, Plus, Search as SearchIcon, Trash2 } from 'lucide-react'
import { FormField } from './FormField'
import { FormSection } from './FormSection'
import { Stepper } from './Stepper'
import { StatCard } from './StatCard'
import { EmptyState } from './EmptyState'
import { AutoLoadFooter } from './AutoLoadFooter'
import { useInfiniteReveal } from './useInfiniteReveal'
import { TableTabs } from './TableTabs'
import { FileDropzone } from './FileDropzone'
import { BarChart } from './BarChart'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { BudgetInline, ProgressMeter } from './ProgressMeter'
import { HealthSummary } from './HealthSummary'
import { FilterChips } from './FilterChips'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct, healthOf } from '@/lib/projectHealth'
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
        <FormField label="Project Number" htmlFor="pn-filled" required help="Editing an existing record. The value is real, not a placeholder.">
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

/** AutoLoadFooter is a table's footer, not a second card below it — always
    render it as the last child inside the same bordered wrapper as the
    table, sharing one border/corner-radius. Never give it its own box.
    Pair with useInfiniteReveal for the visibleCount/loading/onLoadMore
    state; scrolling the footer into view triggers the next batch itself —
    there's no page-number control to click. */
function AutoLoadFooterDemo() {
  const { visibleCount, loadingMore, loadMore } = useInfiniteReveal(781, 10)
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
              <td className="px-lg py-base text-sm text-text-primary">STC: Cabin Interior Modification, Cert Program</td>
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
      <AutoLoadFooter total={781} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="items" />
    </div>
  )
}
export const AutoLoadFooterExample: Story = { render: () => <div className="p-lg"><AutoLoadFooterDemo /></div> }

/** Tabs belong to the table, not above it: they render as the first child of
    the same bordered card, and the active tab's accent underline sits on the
    card's dividing line so the selection joins the rows below. Counts stay
    beside each label. Never render them as standalone pills floating over
    the table. Arrow keys move between tabs (real ARIA tabs); the strip
    scrolls when the tabs outgrow a narrow viewport. */
function TableTabsDemo() {
  const [active, setActive] = useState('priorities')
  const { visibleCount, loadingMore, loadMore } = useInfiniteReveal(26, 10)
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
      <AutoLoadFooter total={26} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="projects" />
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
/** THE applied-filters row — required on every screen that has a Filters
    menu, from client feedback. Three parts, always together:
    1. the trigger counts what's applied — `Filters (2)`;
    2. each applied filter appears below the header as a chip reading
       "Field: Value", with an × that removes only that one;
    3. `Clear filters (n)` removes the lot.
    It renders nothing when no filter is applied, so an unfiltered page keeps
    its full height. Chips are built by a `…FilterChips()` helper that lives
    next to each filter menu's own type, so the labels can't drift from the
    fields they describe. */
function FilterChipsDemo() {
  const [filters, setFilters] = useState<Record<string, string>>({
    Priority: '1 – Fire', Company: 'Duncan Aviation', 'Budget health': 'Over budget',
  })
  const chips = Object.entries(filters).map(([label, value]) => ({
    key: label, label, value,
    onRemove: () => setFilters((f) => { const n = { ...f }; delete n[label]; return n }),
  }))
  return (
    <div className="grid gap-lg p-lg">
      <div className="flex justify-end">
        <Button variant="secondary" size="md" leadingIcon={<FilterIcon size={16} />}>
          Filters{chips.length ? ` (${chips.length})` : ''}
        </Button>
      </div>
      <FilterChips chips={chips} onClearAll={() => setFilters({})} />
      <div className="rounded-sm border border-border-default bg-neutral-25 p-2xl text-center text-sm text-text-muted">
        Table goes here, the chip row sits between the page header and the table.
      </div>
    </div>
  )
}
export const FilterChipsExample: Story = { render: () => <FilterChipsDemo /> }

/** Budget health, computed once in `lib/projectHealth.ts` and rendered the
    same way at project, work-package and activity level. The bar's colour
    comes from the health state and is ALWAYS paired with the percentage in
    text, so state is never carried by colour alone. Past 100% the bar fills
    and turns danger — it never grows past its own track, because a bar that
    rescales or spills hides the overrun. A row with no budget is its own
    state ("No budget set", em dashes), never "0%, on track". */
/** THE picker for every "link an existing record" flow — Aircraft,
    Approvals, Deliverables, Design Data. A plain Select stops being usable
    once its catalog passes a couple of dozen rows, and all of those will.
    Type to filter on both lines; already-linked rows are disabled with a
    reason rather than hidden, so the user isn't left wondering where a record
    went. Portal-rendered so drawers and overflow containers can't clip it. */
function SearchableSelectDemo() {
  const [value, setValue] = useState('')
  return (
    <div className="grid gap-lg" style={{ maxWidth: 420 }}>
      <div className="grid gap-xs">
        <label htmlFor="ss-demo" className="text-sm font-semibold text-text-primary">Select an aircraft to link</label>
        <SearchableSelect
          id="ss-demo"
          value={value}
          onChange={setValue}
          placeholder="Search aircraft by model or manufacturer..."
          options={[
            { value: 'a', label: 'BE350: King Air 350', hint: 'Beechcraft' },
            { value: 'b', label: 'DHC-8-402: Dash 8-400', hint: 'De Havilland' },
            { value: 'c', label: 'CL-600-2B19: CRJ200', hint: 'Bombardier', disabled: true, disabledReason: 'Already linked to this project' },
            { value: 'd', label: 'A330: A330-300', hint: 'Airbus' },
          ]}
        />
      </div>
      <div className="grid gap-xs">
        <label htmlFor="ss-empty" className="text-sm font-semibold text-text-primary">Empty catalog</label>
        <SearchableSelect id="ss-empty" value="" onChange={() => {}} options={[]} emptyLabel="No aircraft in Reference Data yet." />
      </div>
    </div>
  )
}
export const SearchableSelectExample: Story = { render: () => <div className="p-lg"><SearchableSelectDemo /></div> }

/**
 * THE selection standard. Two components, one pattern — never a bespoke
 * dropdown anywhere else:
 *
 * - **Single choice** → `SearchableSelect`. `indicator="radio"` for a form
 *   field picking one of a few alternatives; the default `indicator="check"`
 *   for filters and lookups, where the list is a catalog rather than a small
 *   fixed set.
 * - **Many choices** → `MultiSelect`. Checkboxes, `"n selected"` on the
 *   trigger, and chips underneath naming each pick with an × to drop it.
 *   The chips matter: a count answers "how many", never "which" — which is
 *   exactly what a user wants to know after the menu closes.
 *
 * Both search on label + hint, are portal-rendered so drawers can't clip
 * them, disable rather than hide unavailable options (with a reason), and
 * share the same keyboard model (↑/↓ skipping disabled rows, Enter, Esc).
 */
function SelectionStandardDemo() {
  const [single, setSingle] = useState('active')
  const [lookup, setLookup] = useState('')
  const [many, setMany] = useState<string[]>(['b', 'd'])
  const statuses = [
    { value: 'query', label: 'Query' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'active', label: 'Active' },
    { value: 'complete', label: 'Complete' },
  ]
  const aircraft = [
    { value: 'a', label: 'BE350: King Air 350', hint: 'Beechcraft' },
    { value: 'b', label: 'DHC-8-402: Dash 8-400', hint: 'De Havilland' },
    { value: 'c', label: 'CL-600-2B19: CRJ200', hint: 'Bombardier', disabled: true, disabledReason: 'Already linked to this project' },
    { value: 'd', label: 'A330: A330-300', hint: 'Airbus' },
  ]
  return (
    <div className="grid gap-2xl p-lg" style={{ maxWidth: 460 }}>
      <div className="grid gap-xs">
        <label htmlFor="sel-radio" className="text-sm font-semibold text-text-primary">Single select, radio</label>
        <p className="text-xs text-text-muted">One of a few alternatives, in a form.</p>
        <SearchableSelect id="sel-radio" indicator="radio" value={single} onChange={setSingle} options={statuses} placeholder="Select status..." />
      </div>
      <div className="grid gap-xs">
        <label htmlFor="sel-check" className="text-sm font-semibold text-text-primary">Single select, check</label>
        <p className="text-xs text-text-muted">Picking one record out of a catalog.</p>
        <SearchableSelect id="sel-check" value={lookup} onChange={setLookup} options={aircraft} placeholder="Search aircraft..." />
      </div>
      <div className="grid gap-xs">
        <label htmlFor="sel-multi" className="text-sm font-semibold text-text-primary">Multi select, checkbox + chips</label>
        <p className="text-xs text-text-muted">Count on the trigger, chips naming each pick below.</p>
        <MultiSelect id="sel-multi" value={many} onChange={setMany} options={aircraft} placeholder="Select aircraft..." />
      </div>
    </div>
  )
}
export const SelectionStandard: Story = { render: () => <SelectionStandardDemo /> }

/**
 * THE toolbar row. Every control that sits in a horizontal row with a button —
 * page-header search, a Filters trigger, an Export menu, a primary CTA, an
 * inline "pick a record → Link" row — is **36px tall**. Buttons are already
 * 36px at their default `md` size, so fields in these rows take `size="sm"`.
 *
 * Stacked form fields keep the 44px default: nothing sits beside them to
 * disagree with, and the extra height is the comfortable target for typing.
 * The rule is about *rows*, not about fields in general.
 *
 * Getting this wrong is quietly expensive — a 44px input next to a 36px button
 * has 4px of visual offset top and bottom, which reads as a rendering bug
 * rather than a style choice, and it shows up on every screen at once.
 */
function ToolbarRowStandardDemo() {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState('')
  return (
    <div className="grid gap-2xl p-lg">
      <div className="grid gap-sm">
        <p className="text-xs font-semibold text-text-secondary">Page header: search · filters · export · CTA, all 36px</p>
        <div className="flex flex-wrap items-center gap-sm rounded-sm border border-border-default bg-neutral-25 p-base">
          <div className="min-w-0" style={{ width: 320 }}>
            <label htmlFor="tb-search" className="sr-only">Search projects</label>
            <Input id="tb-search" size="sm" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by number, project, company..." leadingIcon={<SearchIcon size={16} />} />
          </div>
          <Button variant="secondary" leadingIcon={<FilterIcon size={16} />}>Filters</Button>
          <Button variant="secondary">Export</Button>
          <Button leadingIcon={<Plus size={16} />}>Add new project</Button>
        </div>
      </div>

      <div className="grid gap-sm">
        <p className="text-xs font-semibold text-text-secondary">Inline link row: select + action, both 36px</p>
        <div className="grid gap-sm rounded-sm border border-border-default bg-neutral-25 p-base">
          <label htmlFor="tb-attach" className="text-sm font-semibold text-text-primary">Select an aircraft to link</label>
          <div className="flex flex-wrap items-center gap-sm">
            <div className="min-w-0 flex-1" style={{ minWidth: 240 }}>
              <SearchableSelect
                id="tb-attach" size="sm" value={pick} onChange={setPick}
                placeholder="Search aircraft by model or manufacturer..."
                options={[
                  { value: 'a', label: 'BE350: King Air 350', hint: 'Beechcraft' },
                  { value: 'b', label: 'DHC-8-402: Dash 8-400', hint: 'De Havilland' },
                ]}
              />
            </div>
            <Button disabled={!pick}>Link to project</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-sm">
        <p className="text-xs font-semibold text-text-secondary">Stacked form field, 44px, unchanged</p>
        <div className="grid gap-xs rounded-sm border border-border-default bg-neutral-25 p-base" style={{ maxWidth: 380 }}>
          <label htmlFor="tb-form" className="text-sm font-semibold text-text-primary">Model No</label>
          <Input id="tb-form" placeholder="e.g. RV-14A" />
        </div>
      </div>
    </div>
  )
}
export const ToolbarRowStandard: Story = { render: () => <ToolbarRowStandardDemo /> }

export const ProjectHealthExample: Story = {
  render: () => (
    <div className="grid gap-2xl p-lg">
      <HealthSummary health={healthOf(87, 61)} />
      <HealthSummary health={healthOf(40, 58)} />
      <HealthSummary health={healthOf(0, 304.3)} />
      {/* The labelled meter: percentage plus all four figures, which is what a
          reader needs. "used", never "done": the percentage is hours spent
          against hours budgeted, not work completed. */}
      <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg" style={{ maxWidth: 420 }}>
        <p className="text-xs font-semibold text-text-secondary">Labelled meter (showLabel)</p>
        {[healthOf(5, 4.4), healthOf(3, 3.6), healthOf(0, 12)].map((h, i) => (
          <ProgressMeter key={i} health={h} showLabel ariaLabel={`Labelled example ${i + 1}`} />
        ))}
      </div>
      <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
        {[healthOf(80, 20), healthOf(80, 74), healthOf(80, 96), healthOf(80, 80, true), healthOf(0, 12)].map((h, i) => (
          <div key={i} className="flex items-center gap-lg">
            <div className="min-w-0 flex-1"><ProgressMeter health={h} size="sm" ariaLabel={`Example ${i + 1}`} /></div>
            <span className="w-12 shrink-0 text-xs font-semibold text-text-secondary">{formatPct(h.progressPct)}</span>
            <span className="w-32 shrink-0"><Badge tone={HEALTH_TONE[h.state]}>{HEALTH_LABEL[h.state]}</Badge></span>
          </div>
        ))}
      </div>
    </div>
  ),
}

/**
 * Two rules that hold for every table in the app, shown together because they
 * are usually broken together.
 *
 * **Columns are left-aligned — all of them, headings and values.** Numbers
 * included. Right-aligned figures were pulling the eye away from the label that
 * names them, and in a table this wide the reader loses which column they are
 * in. Decimal alignment would be the reason to right-align, and these are
 * one-decimal hours, so there is nothing to gain against the cost.
 *
 * **The summary trio reads hours, bar, percentage.** The percentage owns the
 * right edge because it is what a reader scans down a stack of rows; the bar is
 * the glanceable pip beside it. Both figures share one size and weight.
 */
export const TableFiguresExample: Story = {
  render: () => (
    <div className="grid gap-2xl p-lg">
      <div className="grid gap-sm">
        <p className="text-xs font-semibold text-text-secondary">Summary row: hours, bar, % used</p>
        <div className="grid gap-xs rounded-sm border border-border-default bg-neutral-25 p-lg">
          {[healthOf(4, 4), healthOf(2, 2.4), healthOf(2, 1.7), healthOf(0, 3)].map((h, i) => (
            <div key={i} className="flex items-center gap-sm border-b border-border-default py-sm last:border-b-0">
              <span className="flex-1 truncate text-sm font-semibold text-text-primary">Person {i + 1}</span>
              <Badge tone={HEALTH_TONE[h.state]}>{HEALTH_LABEL[h.state]}</Badge>
              <BudgetInline health={h} ariaLabel={`Person ${i + 1} budget`} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-sm">
        <p className="text-xs font-semibold text-text-secondary">Table columns: left-aligned, figures included</p>
        <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Column alignment reference</caption>
            <thead>
              <tr className="border-b border-border-default">
                {['Activity', 'Budget', 'Actual', 'Remaining', 'Budget used', 'Status'].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-xs font-semibold text-text-secondary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[healthOf(1, 1.3), healthOf(3, 2.7), healthOf(12, 4)].map((h, i) => {
                const over = h.remaining < 0
                return (
                  <tr key={i} className="border-b border-border-default last:border-b-0">
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">Activity {i + 1}</td>
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{formatHours(h.budget)}</td>
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{formatHours(h.actual)}</td>
                    {/* The one figure that keeps colour: the minus sign carries
                        the meaning first, so it is never colour-only. */}
                    <td className={`whitespace-nowrap px-lg py-base text-sm ${over ? 'font-semibold text-danger' : 'text-text-primary'}`}>
                      {over ? '\u2212' : ''}{formatHours(Math.abs(h.remaining))}
                    </td>
                    <td className="px-lg py-base" style={{ minWidth: 120 }}>
                      <div className="flex items-center gap-sm">
                        <div className="min-w-0 flex-1"><ProgressMeter health={h} size="sm" ariaLabel={`Activity ${i + 1} budget`} /></div>
                        <span className="w-9 shrink-0 text-xs font-semibold text-text-primary">{formatPct(h.progressPct)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-lg py-base"><Badge tone={HEALTH_TONE[h.state]}>{HEALTH_LABEL[h.state]}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

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

/**
 * Layering — a dropdown must paint above whatever opened it.
 *
 * This story is a regression guard, not a showcase. Most dropdowns in this app
 * are opened from inside a drawer (Add new project, every entry drawer), and
 * they are portal-rendered to `document.body` so the drawer's `overflow` can't
 * clip them. That only works if the dropdown layer sits **above** the modal
 * layer — otherwise the panel renders behind the drawer and the control looks
 * dead: no open state, no error, nothing.
 *
 * The scale is therefore ordered by what can spawn what:
 * `sticky 1000 → modal 1100 → dropdown 1200 → dialog 1300 → toast 1400 →
 * tooltip 1500`. A confirm dialog opened from a row menu sits above that menu;
 * a toast can fire from inside the dialog. Nothing in this order is about
 * importance — it is about which surface can open which.
 *
 * Open the drawer below and open both dropdowns, including the nested one in
 * the filter-style panel. If any panel is invisible, the scale has regressed.
 */
function DropdownLayeringDemo() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('active')
  const [many, setMany] = useState<string[]>([])
  const aircraft = [
    { value: 'a', label: 'BE350: King Air 350', hint: 'Beechcraft' },
    { value: 'b', label: 'DHC-8-402: Dash 8-400', hint: 'De Havilland' },
    { value: 'c', label: 'A330: A330-300', hint: 'Airbus' },
  ]
  return (
    <div className="p-lg">
      <Button onClick={() => setOpen(true)}>Open drawer with dropdowns</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Dropdowns inside a drawer"
        footer={
          <>
            <span />
            <div className="flex gap-sm">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </div>
          </>
        }
      >
        <div className="grid gap-2xl">
          <div className="grid gap-xs">
            <label htmlFor="layer-status" className="text-sm font-semibold text-text-primary">Status</label>
            <SearchableSelect
              id="layer-status" indicator="radio" value={status} onChange={setStatus}
              options={[
                { value: 'query', label: 'Query' },
                { value: 'active', label: 'Active' },
                { value: 'complete', label: 'Complete' },
              ]}
            />
          </div>
          <div className="grid gap-xs">
            <label htmlFor="layer-aircraft" className="text-sm font-semibold text-text-primary">Aircraft</label>
            <MultiSelect id="layer-aircraft" value={many} onChange={setMany} options={aircraft} placeholder="Select aircraft..." />
          </div>
          <div className="grid gap-xs">
            <label htmlFor="layer-phone" className="text-sm font-semibold text-text-primary">Phone No</label>
            <PhoneInput id="layer-phone" countryCode="+1" onCountryCodeChange={() => {}} number="514-555-0142" onNumberChange={() => {}} />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
export const DropdownLayering: Story = { render: () => <DropdownLayeringDemo /> }

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
              <Truncate>Israel Aircraft Astra SPX / Gulfsream 100: Long-Range Variant, Extended Cabin Configuration</Truncate>
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
        <Checkbox label="Active, available in pickers across the app" defaultChecked />
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
