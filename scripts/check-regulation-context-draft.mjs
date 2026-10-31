import { build } from 'esbuild'

const result = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRegulationDraft, regulationDraftKeys, validateRegulationDraft, buildRegulation } from './src/components/features/gcp/regulationDraft'

const regulations = JSON.parse(readFileSync('public/data/regulations.json', 'utf8'))
const context = { subpartCode: 'B', subsectionCode: 'B01' }
const fresh = createRegulationDraft(undefined, context)
assert.equal(fresh.subpartCode, 'B')
assert.equal(fresh.subsectionCode, 'B01')
assert.equal(fresh.amdt, '', 'classification context must never choose an amendment')
assert.equal(createRegulationDraft().subsectionCode, '', 'global Add stays unclassified')

// Every stored classification survives opening an edit or copy, even when the
// caller supplies different context. Neither placeholders nor cross-prefix
// records are silently reassigned by the contextual authoring flow.
for (const record of regulations) {
  const draft = createRegulationDraft(record, context)
  assert.equal(draft.subpartCode, record.subpartCode)
  assert.equal(draft.subsectionCode, record.subsectionCode)
  assert.equal(draft.amdt, record.amdt)
  assert.equal(draft.requirementText, record.requirementText)
  assert.equal(draft.defaultMocText, record.defaultMocText)
}
const crossPrefix = regulations.find((r) => r.subpartCode === 'K' && r.subsectionCode === 'F01')
assert.ok(crossPrefix, 'exercise an actual cross-prefix saved classification')
const roundTrip = buildRegulation(createRegulationDraft(crossPrefix, context), crossPrefix.id)
assert.deepEqual(roundTrip, crossPrefix)

const valid = { ...fresh, section: '23.21(a)', amdt: '23-34', title: 'Test rule', requirementText: '<p>Exact source wording.</p>' }
assert.deepEqual(regulationDraftKeys(valid), { root: '23.0021(a)', sort: '23.0021(a)_23-34' })
assert.deepEqual(validateRegulationDraft(valid, []), {})
const saved = buildRegulation(valid, 'disposable-test')
assert.equal(saved.requirementText, valid.requirementText)
assert.equal(saved.subsectionCode, context.subsectionCode)
assert.ok(validateRegulationDraft(valid, [saved]).amdt, 'create/copy cannot duplicate an exact section and amendment')
assert.deepEqual(validateRegulationDraft(valid, [saved], saved.id), {}, 'an edit can retain its exact identity')

const explicitKeys = { ...valid, sectionRoot: 'custom-root', sort: 'custom-sort', active: false }
assert.equal(buildRegulation(explicitKeys, 'test').sectionRoot, 'custom-root')
assert.equal(buildRegulation(explicitKeys, 'test').sort, 'custom-sort')
assert.equal(buildRegulation(explicitKeys, 'test').active, false)
const blank = { ...valid, amdt: '' }
assert.ok(validateRegulationDraft(blank, []).amdt)
assert.equal(buildRegulation(blank, 'test').amdt, '', 'blank is never normalized to IR')
assert.equal(buildRegulation({ ...valid, amdt: 'IR' }, 'test').amdt, 'IR')
console.log('PASS: contextual defaults, global Add, all 3973 saved classifications, cross-prefix roundtrip, source text, keys, exact duplicate/edit validation, blank/IR distinction')
`,
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
