import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filter as FilterIcon } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SETTING_TYPE_LABEL } from '@/lib/settingFixtures'
import type { SettingType } from '@/types/setting'

export interface SettingFilters {
  type: '' | SettingType
  section: string
  key: string
  value: string
  status: '' | 'active' | 'inactive'
  description: string
}

export const EMPTY_SETTING_FILTERS: SettingFilters = {
  type: '', section: '', key: '', value: '', status: '', description: '',
}

export interface SoftwareSettingsFilterMenuProps {
  sections: string[]
  filters: SettingFilters
  onApply: (filters: SettingFilters) => void
}

const MENU_WIDTH = 300

const TYPES = Object.keys(SETTING_TYPE_LABEL) as SettingType[]

/** The old screen's in-header filter row, as one menu — same six filters
    (Type, Section, Key, Value, Status, Description), all combinable. */
export function SoftwareSettingsFilterMenu({ sections, filters, onApply }: SoftwareSettingsFilterMenuProps) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="lg"
        leadingIcon={<FilterIcon size={16} />}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </Button>
      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Filter settings"
            className="fixed z-dropdown grid gap-base rounded-sm border border-border-default bg-neutral-25 p-lg shadow-lg"
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          >
            <div className="grid gap-xs">
              <label htmlFor="st-filter-type" className="text-xs font-semibold text-text-secondary">Type</label>
              <Select id="st-filter-type" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as SettingFilters['type'] }))}>
                <option value="">Select Type</option>
                {TYPES.map((t) => <option key={t} value={t}>{SETTING_TYPE_LABEL[t]}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="st-filter-section" className="text-xs font-semibold text-text-secondary">Section</label>
              <Select id="st-filter-section" value={draft.section} onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value }))}>
                <option value="">Select Section</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="st-filter-key" className="text-xs font-semibold text-text-secondary">Key</label>
              <Input id="st-filter-key" value={draft.key} onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))} />
            </div>
            <div className="grid gap-xs">
              <label htmlFor="st-filter-value" className="text-xs font-semibold text-text-secondary">Value</label>
              <Input id="st-filter-value" value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))} />
            </div>
            <div className="grid gap-xs">
              <label htmlFor="st-filter-status" className="text-xs font-semibold text-text-secondary">Status</label>
              <Select id="st-filter-status" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as SettingFilters['status'] }))}>
                <option value="">Select Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div className="grid gap-xs">
              <label htmlFor="st-filter-description" className="text-xs font-semibold text-text-secondary">Description</label>
              <Input id="st-filter-description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>
            <div className="mt-xs flex justify-between gap-sm">
              <Button
                variant="tertiary"
                onClick={() => { setDraft(EMPTY_SETTING_FILTERS); onApply(EMPTY_SETTING_FILTERS); setOpen(false) }}
              >
                Clear
              </Button>
              <Button onClick={() => { onApply(draft); setOpen(false) }}>Apply</Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
