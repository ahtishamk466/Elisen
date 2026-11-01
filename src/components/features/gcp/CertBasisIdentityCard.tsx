import { Download, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { FileLink } from '@/components/patterns/FileLink'
import { IdentityCard } from '@/components/patterns/IdentityCard'
import { Stat } from '@/components/patterns/Stat'
import { levelLabel } from '@/lib/certBasisLevel'
import type { CertBasis } from '@/types/gcp'

export interface CertBasisIdentityCardProps {
  basis: CertBasis
  /** Rules the basis actually resolves to in the library. */
  rules: number
  /** TCCA projects linked to this basis. */
  usedBy: number
  onEdit: () => void
  onImport: () => void
  onDelete: () => void
}

/**
 * The basis page's identity, as a full-width band above the tabs (2026-11-01):
 * the code as the page's one large heading, its description under it, and the
 * figures a reader checks first beside them. A band rather than the side card
 * other record pages use, because a basis has only a few facts and its main
 * content is one wide rule table that needs the page's width.
 *
 * The references (TCDS link, source PDF, the basis as the TCDS words it) show
 * only when filled in; none of the 40 legacy bases carries them.
 */
export function CertBasisIdentityCard({ basis, rules, usedBy, onEdit, onImport, onDelete }: CertBasisIdentityCardProps) {
  return (
    <IdentityCard layout="band" label="Certification basis summary" title={basis.aircraftModel} subtitle={basis.description || undefined}
      meta={basis.basisStatement ? <span className="whitespace-pre-line">Basis on the TCDS: {basis.basisStatement}</span> : undefined}
      actions={
        <ActionsMenu ariaLabel={`Actions for ${basis.aircraftModel}`} items={[
          { label: 'Edit', icon: <Pencil size={16} />, onSelect: onEdit },
          { label: 'Import Regulations', icon: <Download size={16} />, onSelect: onImport },
          { label: 'Delete', icon: <Trash2 size={16} />, onSelect: onDelete, tone: 'danger' },
        ]} />
      }>
      {/* Built From only when the basis was built from an amendment level: on a
          hand-picked basis (all 40 legacy bases) it says nothing. */}
      <dl className="flex flex-wrap gap-x-2xl gap-y-base">
        <Stat dl label="TCDS Number" nowrap>{basis.tcdsNumber || undefined}</Stat>
        <Stat dl label="Regulations" nowrap>{rules}</Stat>
        <Stat dl label="Used By" nowrap>{usedBy} TCCA project{usedBy === 1 ? '' : 's'}</Stat>
        {basis.level && <Stat dl label="Built From">{levelLabel(basis)}</Stat>}
        {basis.tcdsUrl && <Stat dl label="TCDS Link"><FileLink url={basis.tcdsUrl} label="Open TCDS" /></Stat>}
        {basis.sourceDocument && <Stat dl label="Source Document"><FileLink url={basis.sourceDocument.url} label={basis.sourceDocument.name} /></Stat>}
      </dl>
    </IdentityCard>
  )
}
