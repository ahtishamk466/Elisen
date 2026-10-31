import { build } from 'esbuild'

const result = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
import assert from 'node:assert/strict'
import { regulationUsage, regulationUsageSummary } from './src/lib/regulationUsage'
import { useGcpStore as library } from './src/stores/gcpStore'
import { useGcpFlowStore as flow } from './src/stores/gcpFlowStore'

// Disposable process-only records; no source fixture or browser state is edited.
const rule = { id: 'test-used-rule', section: '25.787(a)', amdt: '25-51', title: 'Test compartment',
  subpartCode: 'D', subsectionCode: 'D08', url: '', sort: '25.0787(a)_25-51',
  requirementText: 'Test text', defaultMocText: '', sectionRoot: '25.0787', active: true }
const otherVersion = { ...rule, id: 'test-other-version', amdt: '25-1' }
const blank = { ...rule, id: 'test-blank-version', amdt: '' }
const unused = { ...rule, id: 'test-unused-rule', section: 'TEST.1' }
const basis = { id: 'test-basis-1', aircraftModel: 'TEST', tcdsNumber: '', regulationIds: [rule.id, rule.id] }
const entry = { id: 'test-plan-1', projectId: 'test-project-1', regulationId: rule.id,
  affected: false, complete: true, methodText: '', comments: '', ddsType: '', ddsText: '' }
const bases = [basis, { ...basis, id: 'test-basis-2' }]
const plans = [entry, { ...entry, id: 'test-plan-2' }, { ...entry, id: 'test-plan-3', projectId: 'test-project-2' }]
const usage = regulationUsage(rule.id, bases, plans)
assert.deepEqual(usage, { basisCount: 2, planEntryCount: 3, projectCount: 2, inUse: true })
assert.equal(regulationUsageSummary(usage), '2 certification bases and 3 compliance-plan entries across 2 projects')
assert.equal(regulationUsage(otherVersion.id, bases, plans).inUse, false, 'same section at another amendment is independent')
assert.equal(regulationUsageSummary(regulationUsage('missing', bases, plans)), 'no certification bases or compliance-plan entries')

library.setState({ dataStatus: 'ready', regulations: [rule, otherVersion, blank, unused] })
flow.setState({ bases, planEntries: plans, projectBasis: {}, items: [] })
const originalLinks = JSON.stringify({ bases: flow.getState().bases, entries: flow.getState().planEntries })
assert.equal(library.getState().removeRegulation(rule.id), false, 'Basis and plan references block store removal')
assert.ok(library.getState().regulations.some((r) => r.id === rule.id))
assert.equal(JSON.stringify({ bases: flow.getState().bases, entries: flow.getState().planEntries }), originalLinks)
library.getState().updateRegulation(rule.id, { active: false })
assert.equal(library.getState().removeRegulation(rule.id), false, 'inactive rules with references stay protected')
assert.equal(JSON.stringify({ bases: flow.getState().bases, entries: flow.getState().planEntries }), originalLinks)

flow.setState({ bases: [], planEntries: [entry] })
assert.equal(library.getState().removeRegulation(rule.id), false, 'unaffected completed plan alone still blocks removal')
flow.setState({ bases: [basis], planEntries: [] })
assert.equal(library.getState().removeRegulation(rule.id), false, 'Basis alone blocks removal')
assert.equal(library.getState().removeRegulation(otherVersion.id), true)
assert.ok(library.getState().regulations.some((r) => r.id === rule.id), 'another version is not removed with its sibling')
assert.equal(library.getState().removeRegulation(unused.id), true)
assert.equal(library.getState().removeRegulation('test-missing'), false, 'missing ID cannot report success')

assert.equal(regulationUsage(blank.id, [], []).inUse, false)
flow.setState({ bases: [{ ...basis, regulationIds: [blank.id] }], planEntries: [] })
assert.equal(library.getState().removeRegulation(blank.id), false, 'references added after an earlier usage check are rechecked')
assert.equal(library.getState().regulations.find((r) => r.id === blank.id).amdt, '')
flow.setState({ bases: [], planEntries: [] })
assert.equal(library.getState().removeRegulation(rule.id), true, 'removal is allowed only after every reference is absent')
console.log('PASS: precise usage counts, exact versions, referenced/inactive/completed-plan protection, retained links, unused delete, missing ID, fresh reference recheck, blank preservation')
`,
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
