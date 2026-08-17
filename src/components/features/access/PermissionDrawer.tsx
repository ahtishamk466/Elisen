import { useState } from 'react'
import { Search } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { useAccessStore } from '@/stores/accessStore'
import { rolesGranting, usersReachedByPermission } from '@/lib/accessDisplay'
import type { AccessPermission } from '@/types/access'

export interface PermissionDrawerProps {
  mode: 'create' | 'edit'
  initial?: AccessPermission
  onClose: () => void
  onSubmit: (p: AccessPermission) => void
}

export function PermissionDrawer({ mode, initial, onClose, onSubmit }: PermissionDrawerProps) {
  const isEdit = mode === 'edit'
  const registry = useAccessStore((s) => s.routeRegistry)
  const roles = useAccessStore((s) => s.roles)
  const users = useAccessStore((s) => s.users)
  const rules = useAccessStore((s) => s.rules)
  const [name, setName] = useState(initial?.id ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [routes, setRoutes] = useState<string[]>(initial?.routes ?? [])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const usedByRoles = isEdit ? rolesGranting(initial!.id, roles) : []
  const reached = isEdit ? usersReachedByPermission(initial!.id, users, roles) : []
  const rule = initial?.ruleId ? rules.find((r) => r.id === initial.ruleId) : undefined
  const shownRoutes = registry.filter((r) => r.includes(query.toLowerCase().trim()))

  const toggleRoute = (r: string) =>
    setRoutes((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))

  const submit = () => {
    const id = name.trim().toLowerCase()
    if (!id) { setError('Permission name is required.'); return }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) { setError('Use kebab-case, e.g. activity-assign.'); return }
    onSubmit({ id: initial?.id ?? id, description: description.trim(), routes, ruleId: initial?.ruleId })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Permission “${initial!.id}”` : 'Add Permission'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create Permission'}</Button>
        </>
      }
    >
      {isEdit && (
        <Alert tone="info" title={`Used by ${usedByRoles.length} role${usedByRoles.length === 1 ? '' : 's'} · reaches ${reached.length} user${reached.length === 1 ? '' : 's'}`}>
          {usedByRoles.length > 0
            ? `${usedByRoles.map((r) => r.name).join(', ')}, route changes apply to everyone with those roles.`
            : 'No role grants this yet, attach it to a role to put it to use.'}
        </Alert>
      )}

      <FormSection title="Permission" subtitle="A named capability the app checks before allowing an action.">
        <FormField label="Name" htmlFor="perm-name" required error={error} help={isEdit ? 'Names are stable, roles reference them.' : 'kebab-case, e.g. activity-assign.'}>
          <Input id="perm-name" value={name} error={!!error} disabled={isEdit} placeholder="e.g. activity-assign" onChange={(e) => { setName(e.target.value); setError('') }} />
        </FormField>
        <FormField label="Description" htmlFor="perm-desc">
          <Input id="perm-desc" value={description} placeholder="e.g. Activity Assign" onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        {rule && (
          <FormField label="Rule" htmlFor="perm-rule" help="Rules are code-defined conditions, managed by developers under System.">
            <Input id="perm-rule" value={`${rule.name} (${rule.className})`} disabled />
          </FormField>
        )}
      </FormSection>

      <FormSection
        title="Routes"
        subtitle="The URLs this permission guards. Entries ending in /* cover every child route."
      >
        <Input
          aria-label="Search routes"
          value={query}
          placeholder="Search routes..."
          leadingIcon={<Search size={16} />}
          onChange={(e) => setQuery(e.target.value)}
        />
        {routes.length === 0 && (
          <p className="text-xs text-warning">No routes attached. This permission guards nothing yet.</p>
        )}
        <div className="grid max-h-72 gap-sm overflow-y-auto pr-xs">
          {shownRoutes.map((r) => (
            <Checkbox key={r} label={r} checked={routes.includes(r)} onChange={() => toggleRoute(r)} />
          ))}
          {shownRoutes.length === 0 && <p className="text-sm text-text-muted">No routes match your search.</p>}
        </div>
      </FormSection>
    </Drawer>
  )
}
