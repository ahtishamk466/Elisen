import { useEffect, useState } from 'react'
import type { CertBasis } from '@/types/gcp'
import { RulePicker } from '../RulePicker'
import type { BasisDraft } from './FlowStepBasis'

/**
 * Step 2's "Pick rules by hand" mode: the basis's rules, one exact rule at a
 * time (`RulePicker`), starting from the project's own basis when it has one.
 * Section and Amendment stay two fields (client instruction, 2026-09-24), but
 * each Add attaches exactly the rule picked, never every combination.
 */
export function BasisHandPicker({ existing, onDraft }: {
  existing?: CertBasis
  onDraft: (draft: BasisDraft | null) => void
}) {
  const [ruleIds, setRuleIds] = useState<string[]>(() => existing?.regulationIds ?? [])

  useEffect(() => {
    onDraft(ruleIds.length > 0 ? { kind: 'save', regulationIds: ruleIds, fields: { level: undefined } } : null)
  }, [ruleIds, onDraft])

  return (
    <div className="rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
      <RulePicker idPrefix="flow-rule" value={ruleIds} onChange={setRuleIds} listLabel="Rules in this basis" />
    </div>
  )
}
