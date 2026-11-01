import type { Regulation } from '@/types/gcp'

export interface RegulationGroupOption {
  value: string
  label: string
  hint: string
}

/** Groups select exact Section Root strings, never a representative amendment.
    Source titles enrich search without changing what the group stores. */
export function regulationGroupOptions(regulations: Regulation[], savedRoots: string[] = []): RegulationGroupOption[] {
  const byRoot = new Map<string, Regulation[]>()
  for (const regulation of regulations) {
    const records = byRoot.get(regulation.sectionRoot) ?? []
    records.push(regulation)
    byRoot.set(regulation.sectionRoot, records)
  }
  const saved = new Set(savedRoots)
  const roots = new Set([...byRoot.keys()].filter((root) => root !== ''))
  saved.forEach((root) => roots.add(root))

  return [...roots].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((root) => {
    const records = byRoot.get(root) ?? []
    const placeholder = /^-+$/.test(root.trim())
    const blank = root.trim() === ''
    const label = placeholder ? 'Unspecified Section Root' : blank ? `${saved.has(root) ? 'Blank saved' : 'Blank'} Section Root` : root
    if (records.length === 0) {
      return { value: root, label, hint: 'Saved selection — no matching regulation in the current library.' }
    }

    const count = new Set(records.map((record) => record.id)).size
    if (placeholder) {
      return { value: root, label, hint: `${count} different regulation${count === 1 ? ' shares' : 's share'} this unspecified root.` }
    }

    const titles = [...new Set(records.map((record) => record.title.replace(/\s+/g, ' ').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
    const titleHint = titles.length > 1 ? `Multiple titles: ${titles.join(' · ')}` : titles[0] || 'No title recorded.'
    const recordCount = `${count} distinct regulation record${count === 1 ? '' : 's'}`
    const hint = blank
      ? `${saved.has(root) ? 'Saved blank Section Root. ' : ''}${recordCount} have this blank root. ${titleHint}`
      : titleHint
    return { value: root, label, hint }
  })
}
