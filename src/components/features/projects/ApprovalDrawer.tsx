import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useTccaStore } from '@/stores/tccaStore'
import type { Approval, ApprovalAuthority, ApprovalType } from '@/types/documents'
import { useProjectLabel } from './useProjectLabel'

export interface ApprovalDrawerProps {
  projectId: string
  initial?: Approval
  onClose: () => void
  onSubmit: (a: Approval) => void
}

/** Record an issued certificate and tie it to this project. */
export function ApprovalDrawer({ projectId, initial, onClose, onSubmit }: ApprovalDrawerProps) {
  const label = useProjectLabel(projectId)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const linkedTcca = tccaProjects.filter((t) => t.projectIds.includes(projectId))
  const isEdit = !!initial

  const [number, setNumber] = useState(initial?.number ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [authority, setAuthority] = useState<ApprovalAuthority>(initial?.authority ?? 'tcca')
  const [type, setType] = useState<ApprovalType>(initial?.type ?? 'stc')
  const [aircraft, setAircraft] = useState(initial?.aircraft ?? '')
  const [issuedDate, setIssuedDate] = useState(initial?.issuedDate ?? '')
  const [tccaProjectId, setTccaProjectId] = useState(initial?.tccaProjectId ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = () => {
    const e: Record<string, string> = {}
    if (!number.trim()) e.number = 'Certificate number is required.'
    if (!title.trim()) e.title = 'Title is required.'
    if (!issuedDate) e.issuedDate = 'Issue date is required.'
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      number: number.trim(),
      title: title.trim(),
      authority,
      type,
      aircraft: aircraft.trim(),
      issuedDate,
      projectIds: initial?.projectIds ?? [projectId],
      tccaProjectId: tccaProjectId || undefined,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Approval ${initial.number} — ${label}` : `Add Approval “${label}”`}
      footer={
        <>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add Approval'}</Button>
          </div>
        </>
      }
    >
      <FormSection title="Certificate" subtitle="An issued approval this project relates to — its own STC, or an earlier certificate it modifies.">
        <FormField label="Number" htmlFor="ap-number" required error={errors.number} help="e.g. STC SA26-102">
          <Input id="ap-number" value={number} error={!!errors.number} onChange={(e) => { setNumber(e.target.value); setErrors((p) => ({ ...p, number: '' })) }} />
        </FormField>
        <FormField label="Title" htmlFor="ap-title" required error={errors.title}>
          <Input id="ap-title" value={title} error={!!errors.title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })) }} />
        </FormField>
        <FormField label="Authority" htmlFor="ap-authority">
          <Select id="ap-authority" value={authority} onChange={(e) => setAuthority(e.target.value as ApprovalAuthority)}>
            <option value="tcca">TCCA</option>
            <option value="faa">FAA</option>
            <option value="easa">EASA</option>
          </Select>
        </FormField>
        <FormField label="Type" htmlFor="ap-type">
          <Select id="ap-type" value={type} onChange={(e) => setType(e.target.value as ApprovalType)}>
            <option value="stc">STC</option>
            <option value="stc-amendment">STC Amendment</option>
            <option value="minor">Minor Approval</option>
          </Select>
        </FormField>
        <FormField label="Aircraft Type" htmlFor="ap-aircraft">
          <Input id="ap-aircraft" value={aircraft} placeholder="e.g. King Air 350" onChange={(e) => setAircraft(e.target.value)} />
        </FormField>
        <FormField label="Issued Date" htmlFor="ap-issued" required error={errors.issuedDate}>
          <Input id="ap-issued" type="date" value={issuedDate} error={!!errors.issuedDate} onChange={(e) => { setIssuedDate(e.target.value); setErrors((p) => ({ ...p, issuedDate: '' })) }} />
        </FormField>
        {linkedTcca.length > 0 && (
          <FormField label="TCCA Project" htmlFor="ap-tcca" help="Optional — the TCCA project that produced this certificate.">
            <Select id="ap-tcca" value={tccaProjectId} placeholder="Not tracked here" onChange={(e) => setTccaProjectId(e.target.value)}>
              <option value="">Not tracked here</option>
              {linkedTcca.map((t) => <option key={t.id} value={t.id}>{t.number} — {t.description}</option>)}
            </Select>
          </FormField>
        )}
      </FormSection>
    </Drawer>
  )
}
