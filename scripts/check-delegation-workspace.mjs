import { build } from 'esbuild'

const result = await build({ stdin: { resolveDir: process.cwd(), contents: `
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FOC_LIST, DELEGATIONS } from './src/lib/gcpFixtures'
import { delegationWorkspace } from './src/lib/delegationWorkspace'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GcpDelegationTab } from './src/components/features/gcp/GcpDelegationTab'
import { useGcpStore } from './src/stores/gcpStore'

const regulations = JSON.parse(readFileSync('public/data/regulations.json', 'utf8'))
const before = JSON.stringify([DELEGATIONS, FOC_LIST, regulations])
const all = delegationWorkspace(DELEGATIONS, FOC_LIST, regulations)
assert.equal(DELEGATIONS.length, 720)
assert.equal(FOC_LIST.length, 63)
assert.equal(all.length, 63, 'every known FOC is selectable, including zero-rule entries')
assert.equal(all.reduce((sum, group) => sum + group.recordCount, 0), 720)
assert.equal(all.reduce((sum, group) => sum + group.duplicateRecordCount, 0), 0)
assert.equal(all.filter((group) => group.recordCount > 0).length, 8)
for (const source of DELEGATIONS) {
  const group = all.find((item) => item.focCode === source.focCode)
  assert.ok(group.rules.some((rule) => rule.delegation === source), source.id)
}
const inactiveCount = all.flatMap((group) => group.rules).filter((rule) => !rule.delegation.active).length
assert.equal(inactiveCount, DELEGATIONS.filter((row) => !row.active).length)
assert.equal(inactiveCount, 577)
const libraryRoots = new Set(regulations.map((row) => row.sectionRoot))
const missing = all.flatMap((group) => group.rules).filter((rule) => !libraryRoots.has(rule.delegation.sectionRoot))
assert.equal(missing.length, 226)
assert.ok(missing.every((rule) => rule.hint.includes('no matching regulation')))
assert.ok(missing.every((rule) => !rule.hasRegulation), 'missing roots must not display a guessed rule title')
assert.ok(all.flatMap((group) => group.rules).filter((rule) => libraryRoots.has(rule.delegation.sectionRoot)).every((rule) => rule.hasRegulation))

const ap01 = all.find((group) => group.focCode === 'AP-01')
const ap01Foc = FOC_LIST.find((foc) => foc.code === 'AP-01')
assert.equal(ap01.authoritySpecialist, ap01Foc.authoritySpecialist)
assert.equal(ap01.specialty, ap01Foc.specialty)
const personSearch = delegationWorkspace(DELEGATIONS, FOC_LIST, regulations, ap01Foc.authoritySpecialist)
assert.equal(personSearch.find((group) => group.focCode === 'AP-01').matchingRecordCount, ap01.recordCount)
const codeSearch = delegationWorkspace(DELEGATIONS, FOC_LIST, regulations, 'AP-01')
assert.equal(codeSearch.find((group) => group.focCode === 'AP-01').matchingRecordCount, ap01.recordCount)
const rootSearch = delegationWorkspace(DELEGATIONS, FOC_LIST, regulations, '25.1301')
assert.ok(rootSearch.length > 0)
assert.ok(rootSearch.every((group) => group.matchingRules.every((rule) => rule.delegation.sectionRoot.includes('25.1301'))))
const titleSearch = delegationWorkspace(DELEGATIONS, FOC_LIST, regulations, 'Function and installation')
assert.ok(titleSearch.length > 0)
assert.ok(titleSearch.every((group) => group.matchingRules.every((rule) => regulations.some((row) =>
  row.sectionRoot === rule.delegation.sectionRoot && row.title.toLowerCase().includes('function and installation')))))
assert.deepEqual(delegationWorkspace(DELEGATIONS, FOC_LIST, regulations, 'no-match-unique-token'), [])
assert.deepEqual(delegationWorkspace(DELEGATIONS, FOC_LIST, regulations, '25-51'), [], 'delegation search does not invent amendment-level coverage')

const base = DELEGATIONS[0]
const sourceRegulation = regulations[0]
const customFocs = [
  { ...ap01Foc, authoritySpecialist: 'A locally edited specialist', specialty: 'Custom specialty' },
  { ...ap01Foc, id: 'zero', code: 'ZERO', authoritySpecialist: 'No rules yet' },
  { ...ap01Foc, id: 'placeholder', code: '-', authoritySpecialist: '-', specialty: '-' },
]
const customRows = [
  { ...base, id: 'one', focCode: 'AP-01', sectionRoot: 'EXACT ' },
  { ...base, id: 'two', focCode: 'AP-01', sectionRoot: 'EXACT ', active: false },
  { ...base, id: 'three', focCode: 'AP-01', sectionRoot: 'EXACT' },
  { ...base, id: 'unknown', focCode: 'UNKNOWN', sectionRoot: 'old-missing' },
  { ...base, id: 'raw-code', focCode: 'AP-01 ', sectionRoot: 'old-missing' },
  { ...base, id: 'blank', focCode: '', sectionRoot: '' },
  { ...base, id: 'placeholder', focCode: '-', sectionRoot: '-' },
]
const customRegulations = [
  { ...sourceRegulation, id: 'title-one', sectionRoot: 'EXACT ', title: '  First\\n title  ', amdt: '' },
  { ...sourceRegulation, id: 'title-two', sectionRoot: 'EXACT ', title: 'Second title', amdt: '25-51', active: false },
  { ...sourceRegulation, id: 'placeholder-one', sectionRoot: '-', title: 'Unrelated placeholder title' },
]
const customBefore = JSON.stringify([customRows, customFocs, customRegulations])
const custom = delegationWorkspace(customRows, customFocs, customRegulations)
const edited = custom.find((group) => group.focCode === 'AP-01')
assert.equal(edited.authoritySpecialist, 'A locally edited specialist', 'use supplied FOC state, never a hardcoded name')
assert.equal(edited.recordCount, 3)
assert.equal(edited.rootCount, 2, 'do not trim or collapse distinct raw roots')
assert.equal(edited.duplicateRecordCount, 1)
assert.equal(edited.rules.filter((rule) => rule.duplicate).length, 2)
assert.ok(edited.rules.find((rule) => rule.delegation.id === 'one').hint.includes('Second title'))
const byTitle = delegationWorkspace(customRows, customFocs, customRegulations, 'second title').find((group) => group.focCode === 'AP-01')
assert.equal(byTitle.recordCount, 3)
assert.equal(byTitle.matchingRecordCount, 2)
assert.equal(byTitle.matchingRootCount, 1)
assert.equal(delegationWorkspace(customRows, customFocs, customRegulations, 'custom specialty')[0].matchingRecordCount, 3)
assert.equal(custom.find((group) => group.focCode === 'ZERO').rootCount, 0)
assert.equal(delegationWorkspace(customRows, customFocs, customRegulations, 'No rules yet')[0].recordCount, 0)
assert.equal(custom.find((group) => group.focCode === 'UNKNOWN').authoritySpecialist, 'FOC entry not found')
assert.equal(custom.find((group) => group.focCode === 'AP-01 ').foc, undefined, 'FOC grouping preserves exact raw codes')
assert.equal(custom.find((group) => group.focCode === '').rules[0].delegation.sectionRoot, '')
const placeholder = custom.find((group) => group.focCode === '-')
assert.equal(placeholder.authoritySpecialist, '-')
assert.equal(placeholder.rules[0].label, 'Unspecified Section Root')
assert.ok(!placeholder.rules[0].hint.includes('Unrelated placeholder title'))
assert.equal(delegationWorkspace(customRows, customFocs, [], '')[0].recordCount, custom[0].recordCount, 'an unloaded library never removes saved rows')
assert.equal(JSON.stringify([customRows, customFocs, customRegulations]), customBefore)
assert.equal(JSON.stringify([DELEGATIONS, FOC_LIST, regulations]), before)
// A failed title-only search must expose the real retry path even when
// there is no selected specialist panel. This is process-only SSR state.
const initial = useGcpStore.getInitialState()
const originalInitial = { ...initial }
Object.assign(initial, { delegations: DELEGATIONS, focs: FOC_LIST, regulations: [], dataStatus: 'error' })
const failedSearch = renderToStaticMarkup(createElement(GcpDelegationTab, {
  createOpen: false, onCreateOpenChange: () => {}, query: 'Function and installation',
}))
assert.ok(failedSearch.includes('Regulation titles could not be loaded'))
assert.ok(failedSearch.includes('Try Again'))
assert.ok(!failedSearch.includes('No specialists or rules match your search'))
initial.dataStatus = 'loading'
const loadingSearch = renderToStaticMarkup(createElement(GcpDelegationTab, {
  createOpen: false, onCreateOpenChange: () => {}, query: 'Function and installation',
}))
assert.ok(loadingSearch.includes('Loading regulation titles'))
Object.assign(initial, originalInitial)
console.log('PASS: all720 saved rows/63FOCs,8 populated specialists,577 inactive/226 missing-root rows retained; exact roots, duplicate counts, supplied names, person/title search, placeholders, zero-rule/unknown FOCs, no mutation or amendment inference')
` }, bundle: true, platform: 'node', format: 'esm', banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(process.cwd() + '/package.json');" }, write: false })
try {
  await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
