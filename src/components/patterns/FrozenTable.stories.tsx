import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/Button'
import { FrozenTable } from './FrozenTable'
import { SortableTh } from './SortableTh'
import { useTableSort } from './useTableSort'
import { AutoLoadFooter } from './AutoLoadFooter'
import { useInfiniteReveal } from './useInfiniteReveal'

const meta: Meta<typeof FrozenTable> = { title: 'Patterns/FrozenTable', component: FrozenTable }
export default meta
type Story = StoryObj<typeof meta>
const WIDTHS = [160, 280, 120, 100]
const LABELS = ['Number', 'Description', 'Hours', 'Actions']
const ROWS = Array.from({ length: 80 }, (_, index) => ({
  id: index + 1, number: `TEST-${String(index + 1).padStart(3, '0')}`,
  description: `Example activity ${index + 1}`, hours: (index * 7) % 40,
}))

function Demo({ count = 80, narrow = false, sorting = false, fill = false, autoLoad = false }: {
  count?: number; narrow?: boolean; sorting?: boolean; fill?: boolean; autoLoad?: boolean
}) {
  const [opened, setOpened] = useState<number | null>(null)
  const { sorted, sort, setSort } = useTableSort(ROWS.slice(0, count), {
    number: (row) => row.number, description: (row) => row.description, hours: (row) => row.hours,
  })
  const { visibleCount, loadingMore, loadMore } = useInfiniteReveal(count, 20)
  const rows = autoLoad ? sorted.slice(0, visibleCount) : sorted
  return (
    <div className="grid gap-lg p-lg" style={{ width: narrow ? 375 : undefined, maxWidth: '100%' }}>
      <div className={fill ? 'flex min-h-0 flex-col' : ''} style={fill ? { height: 320 } : undefined}>
        <FrozenTable columns={WIDTHS} minWidth={660} caption="Example activity records" columnLabels={LABELS}
          className="rounded-sm border border-border-default bg-neutral-25" fill={fill}
          bodyStyle={narrow || autoLoad ? { maxHeight: 240 } : undefined}
          header={<thead><tr className="border-b border-border-default bg-neutral-50">
            {(['number', 'description', 'hours'] as const).map((key, index) => (
              <SortableTh key={key} sortKey={sorting ? key : undefined} sort={sort} onSortChange={sorting ? setSort : undefined}
                className="px-lg py-base text-sm font-semibold text-text-secondary">{LABELS[index]}</SortableTh>
            ))}
            <th scope="col" className="sticky right-0 bg-neutral-50 px-lg py-base text-sm font-semibold text-text-secondary">Actions</th>
          </tr></thead>}
          footer={autoLoad ? <AutoLoadFooter total={count} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="activities" /> : undefined}>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="px-lg py-lg text-sm text-text-muted">No records found.</td></tr>}
            {rows.map((row) => <tr key={row.id} className="border-b border-border-default last:border-b-0">
              <td className="px-lg py-base text-sm text-text-primary">{row.number}</td>
              <td className="px-lg py-base text-sm text-text-primary">{row.description}</td>
              <td className="px-lg py-base text-sm text-text-primary">{row.hours}</td>
              <td className="sticky right-0 bg-neutral-25 px-lg py-base"><Button size="sm" variant="tertiary" onClick={() => setOpened(row.id)} aria-label={`Open ${row.number}`}>Open</Button></td>
            </tr>)}
          </tbody>
        </FrozenTable>
      </div>
      <p role="status" className="text-sm text-text-secondary">{opened ? `Opened TEST-${String(opened).padStart(3, '0')}` : 'Scroll the rows; the one interactive header stays above them.'}</p>
    </div>
  )
}

export const Populated: Story = { render: () => <Demo /> }
export const Short: Story = { render: () => <Demo count={3} /> }
export const Empty: Story = { render: () => <Demo count={0} /> }
export const Narrow: Story = { render: () => <Demo narrow /> }
export const Sorting: Story = { render: () => <Demo sorting /> }
export const FillPanel: Story = { render: () => <Demo fill /> }
export const AutoLoading: Story = { render: () => <Demo autoLoad /> }
