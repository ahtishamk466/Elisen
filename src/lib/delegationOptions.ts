import type { Delegation, Foc, Regulation } from '@/types/gcp'
import { regulationGroupOptions } from './regulationGroupOptions'

type Selection = Pick<Delegation, 'sectionRoot' | 'focCode'>

/** A saved delegation can reference roots or FOC codes absent from today's
    library. Keep those exact values visible until the user chooses another. */
export function delegationOptions(regulations: Regulation[], focs: Foc[], saved?: Selection, current?: Selection) {
  const retainedRoots = saved ? [saved.sectionRoot] : []
  const retainedFocs = saved ? [saved.focCode] : []
  if (current?.sectionRoot) retainedRoots.push(current.sectionRoot)
  if (current?.focCode) retainedFocs.push(current.focCode)

  const focOptions = focs.map((foc) => ({ value: foc.code, label: foc.code, hint: foc.authoritySpecialist }))
  const availableFocs = new Set(focOptions.map((option) => option.value))
  for (const code of new Set(retainedFocs)) {
    if (availableFocs.has(code)) continue
    focOptions.push({
      value: code,
      label: code.trim() ? code : 'Blank saved FOC Code',
      hint: 'Saved selection — no matching FOC code in the current list.',
    })
  }

  return {
    sectionRoots: regulationGroupOptions(regulations, retainedRoots),
    focCodes: focOptions,
  }
}
