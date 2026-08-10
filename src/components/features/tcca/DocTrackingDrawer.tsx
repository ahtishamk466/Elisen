import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useTccaStore } from '@/stores/tccaStore'
import type { DeliverableRevision, TccaDocLink, TccaDocState, TccaInvolvement } from '@/types/tcca'

/** Edit the government-interaction tracking for one linked revision. */
export function DocTrackingDrawer({ link, revision, onClose }: { link: TccaDocLink; revision?: DeliverableRevision; onClose: () => void }) {
  const updateDocLink = useTccaStore((s) => s.updateDocLink)
  const [involvement, setInvolvement] = useState<TccaInvolvement>(link.involvement)
  const [sentDate, setSentDate] = useState(link.sentDate)
  const [state, setState] = useState<TccaDocState>(link.state)
  const [error, setError] = useState('')

  const save = () => {
    if (state !== 'not-sent' && !sentDate) {
      setError('Enter the date it was sent to Transport Canada.')
      return
    }
    updateDocLink(link.id, { involvement, sentDate, state })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={revision ? `Tracking — ${revision.number} rev ${revision.rev}` : 'Tracking'}
      footer={
        <>
          <span />
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={save}>Save Changes</Button>
          </div>
        </>
      }
    >
      <FormSection title="Transport Canada tracking" subtitle="How TCCA is involved with this document, and where it stands.">
        <FormField label="Involvement" htmlFor="doc-involvement" help="Whether TCCA wants to see, review, or approve this document.">
          <Select id="doc-involvement" value={involvement} onChange={(e) => setInvolvement(e.target.value as TccaInvolvement)}>
            <option value="none">No involvement</option>
            <option value="review">TCCA reviews</option>
            <option value="approve">TCCA approves</option>
          </Select>
        </FormField>
        <FormField label="Sent Date" htmlFor="doc-sent" error={error}>
          <Input id="doc-sent" type="date" value={sentDate} error={!!error} onChange={(e) => { setSentDate(e.target.value); setError('') }} />
        </FormField>
        <FormField label="Status" htmlFor="doc-state">
          <Select id="doc-state" value={state} onChange={(e) => setState(e.target.value as TccaDocState)}>
            <option value="not-sent">Not sent</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="comments">Comments received</option>
          </Select>
        </FormField>
      </FormSection>
    </Drawer>
  )
}
