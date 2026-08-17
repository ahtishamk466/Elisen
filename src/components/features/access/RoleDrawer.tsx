import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { AccordionSection } from '@/components/patterns/AccordionSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { useAccessStore } from '@/stores/accessStore'
import { groupByModule, inheritedPermissionIds, moduleLabel, roleMembers, wouldCreateCycle } from '@/lib/accessDisplay'
import type { AccessRole } from '@/types/access'

export interface RoleDrawerProps {
  mode: 'create' | 'edit'
  initial?: AccessRole
  onClose: () => void
  onSubmit: (role: AccessRole) => void
}

export function RoleDrawer({ mode, initial, onClose, onSubmit }: RoleDrawerProps) {
  const isEdit = mode === 'edit'
  const permissions = useAccessStore((s) => s.permissions)
  const roles = useAccessStore((s) => s.roles)
  const users = useAccessStore((s) => s.users)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [permissionIds, setPermissionIds] = useState<string[]>(initial?.permissionIds ?? [])
  const [childRoleIds, setChildRoleIds] = useState<string[]>(initial?.childRoleIds ?? [])
  const [error, setError] = useState('')

  const members = isEdit ? roleMembers(initial!.id, users) : []
  const grouped = groupByModule(permissions.map((p) => p.id))
  const inherited = inheritedPermissionIds(childRoleIds, roles)
  const otherRoles = roles.filter((r) => r.id !== initial?.id)

  const togglePermission = (id: string) =>
    setPermissionIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  const toggleChild = (id: string) =>
    setChildRoleIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  const submit = () => {
    if (!name.trim()) { setError('Role name is required.'); return }
    onSubmit({
      id: initial?.id ?? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: name.trim(),
      description: description.trim(),
      permissionIds,
      childRoleIds,
      ruleId: initial?.ruleId,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Role “${initial!.name}”` : 'Add Role'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create Role'}</Button>
        </>
      }
    >
      {isEdit && members.length > 0 && (
        <Alert tone="info" title={`Changes affect ${members.length} member${members.length === 1 ? '' : 's'}`}>
          {members.map((m) => m.username).join(', ')} will gain or lose these permissions immediately.
        </Alert>
      )}

      <FormSection title="Role" subtitle="A job function that bundles permissions.">
        <FormField label="Name" htmlFor="role-name" required error={error}>
          <Input id="role-name" value={name} error={!!error} placeholder="e.g. Elisen - Auditor" onChange={(e) => { setName(e.target.value); setError('') }} />
        </FormField>
        <FormField label="Description" htmlFor="role-desc">
          <Textarea id="role-desc" value={description} placeholder="What this role is for..." onChange={(e) => setDescription(e.target.value)} />
        </FormField>
      </FormSection>

      <FormSection
        title="Inherits roles"
        subtitle="This role also grants everything the ticked roles grant. Their permissions show below as locked."
      >
        <div className="grid gap-sm">
          {otherRoles.map((r) => {
            const cycles = !childRoleIds.includes(r.id) && !!initial && wouldCreateCycle(r.id, initial.id, roles)
            return (
              <div key={r.id}>
                <Checkbox
                  label={r.name}
                  checked={childRoleIds.includes(r.id)}
                  disabled={cycles}
                  onChange={() => toggleChild(r.id)}
                />
                {cycles && (
                  <p className="mt-xxss pl-2xl text-xs text-text-muted">
                    Unavailable — {r.name} already inherits this role, so ticking it would create a loop.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </FormSection>

      {grouped.map(([module, ids]) => {
        const granted = ids.filter((id) => permissionIds.includes(id) || inherited.has(id)).length
        return (
          <AccordionSection
            key={module}
            title={moduleLabel(module)}
            meta={`${granted} of ${ids.length} granted`}
            defaultOpen={granted > 0}
          >
            <div className="grid gap-sm">
              {ids.map((id) => {
                const p = permissions.find((x) => x.id === id)!
                const isInherited = inherited.has(id) && !permissionIds.includes(id)
                return (
                  <div key={id}>
                    <Checkbox
                      label={`${id}: ${p.description}${isInherited ? ' · inherited' : ''}`}
                      checked={permissionIds.includes(id) || isInherited}
                      disabled={isInherited}
                      onChange={() => togglePermission(id)}
                    />
                  </div>
                )
              })}
            </div>
          </AccordionSection>
        )
      })}
    </Drawer>
  )
}
