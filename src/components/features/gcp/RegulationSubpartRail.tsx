import { useEffect, useRef } from 'react'
import { PanelLeftClose, PanelLeftOpen, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Truncate } from '@/components/patterns/Truncate'
import { Button } from '@/components/ui/Button'
import { titleCaseName } from '@/lib/gcpDisplay'
import type { Subpart } from '@/types/gcp'

export function RegulationSubpartRail({ subparts, selectedCode, count, onSelect, onEdit, onDelete, collapsed, onToggle }: {
  subparts: Subpart[]; selectedCode?: string; count: (code: string) => number; onSelect: (sp: Subpart) => void
  onEdit: (sp: Subpart) => void; onDelete: (sp: Subpart) => void
  collapsed: boolean; onToggle: () => void
}) {
  const railRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    railRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selectedCode, collapsed])
  return (
            <nav aria-label="Subparts" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              <div className={`flex shrink-0 items-center gap-xs border-b border-border-default bg-neutral-50 px-xs py-sm ${collapsed ? 'justify-center' : ''}`}>
                {!collapsed && <>
                  <span className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">Subpart</span>
                  <span className="shrink-0 text-xs font-semibold text-text-secondary">Subsections</span>
                </>}
                <Button variant="tertiary" size="sm" onClick={onToggle} aria-expanded={!collapsed}
                  aria-controls="certification-subparts" aria-label={collapsed ? 'Expand subparts' : 'Collapse subparts'}
                  title={collapsed ? 'Expand subparts' : 'Collapse subparts'}
                  leadingIcon={collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />} />
              </div>
              <div id="certification-subparts" ref={railRef} className="min-h-0 flex-1 overflow-y-auto">
                <ul>
                  {subparts.map((sp) => {
                    const isSel = sp.code === selectedCode
                    const topicCount = count(sp.code)
                    const codeMark = <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle px-xxss text-xs font-bold text-accent">{sp.code}</span>
                    return (
                      <li key={sp.id} className={`flex items-center border-b border-border-default last:border-b-0 ${isSel ? 'bg-neutral-100' : ''}`}>
                        <button
                          type="button"
                          onClick={() => onSelect(sp)}
                          aria-current={isSel ? 'true' : undefined}
                          title={collapsed ? `${sp.code} — ${titleCaseName(sp.description)}` : undefined}
                          className={`flex min-w-0 flex-1 items-center gap-xs border-l-2 py-base text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary ${collapsed ? 'px-xs' : 'px-sm'}
                            ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          {collapsed ? <span aria-hidden className="flex min-w-0 flex-1 justify-center whitespace-nowrap">{codeMark}</span> : <>
                          <span className="grid min-w-0 flex-1 gap-xxss">
                            <span className={`flex items-center gap-xs truncate text-sm text-text-primary ${isSel ? 'font-semibold' : ''}`}>
                              {codeMark}
                              <Truncate lines={1}>{titleCaseName(sp.description)}</Truncate>
                            </span>
                          </span>
                          <span aria-hidden className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary">
                            {topicCount}
                          </span>
                          </>}
                          <span className="sr-only">
                            Subpart {sp.code}, {titleCaseName(sp.description)}, {topicCount} subsection{topicCount === 1 ? '' : 's'}
                          </span>
                        </button>
                        {!collapsed && <div className="shrink-0 pr-xs">
                          <ActionsMenu ariaLabel={`Actions for subpart ${sp.code}`} items={[
                            { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit(sp) },
                            { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => onDelete(sp), tone: 'danger' },
                          ]} />
                        </div>}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </nav>
  )
}
