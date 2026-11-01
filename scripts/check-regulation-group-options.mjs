import { build } from 'esbuild'

const result = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { regulationGroupOptions } from './src/lib/regulationGroupOptions'

const regulations = JSON.parse(readFileSync('public/data/regulations.json', 'utf8'))
assert.equal(regulations.length, 3973)
const saved = ['saved-unknown-root', '', '  ', '25.0787', 'saved-unknown-root']
const snapshot = JSON.stringify([regulations, saved])
const available = regulationGroupOptions(regulations)
assert.equal(available.length, 797)
assert.equal(new Set(available.map((option) => option.value)).size, available.length)
const stowage = available.find((option) => option.value === '25.0787')
assert.equal(stowage.label, '25.0787', 'label is the root, not an arbitrary Section or Amendment')
assert.ok(stowage.hint.startsWith('Multiple titles: '))
const stowageTitles = [...new Set(regulations.filter((r) => r.sectionRoot === stowage.value)
  .map((r) => r.title.replace(/\\s+/g, ' ').trim()).filter(Boolean))]
assert.equal(stowageTitles.length, 4)
for (const title of stowageTitles) assert.ok(stowage.hint.includes(title))
assert.ok(!stowage.label.includes('25-51'))
const placeholder = available.find((option) => option.value === '-')
assert.equal(placeholder.label, 'Unspecified Section Root')
assert.equal(placeholder.hint, '391 different regulations share this unspecified root.')

// Every source title stays searchable, including inactive rows and title
// conflicts, rather than selecting the first record to stand for a root.
for (const record of regulations) {
  if (record.sectionRoot === '' || /^-+$/.test(record.sectionRoot.trim())) continue
  const option = available.find((candidate) => candidate.value === record.sectionRoot)
  assert.ok(option)
  const title = record.title.replace(/\\s+/g, ' ').trim()
  if (title) assert.ok(option.hint.includes(title), record.id)
}
const options = regulationGroupOptions(regulations, saved)
assert.equal(options.length, available.length + 3)
for (const root of new Set(saved)) assert.ok(options.some((option) => option.value === root))
for (const root of ['saved-unknown-root', '', '  ']) {
  const option = options.find((candidate) => candidate.value === root)
  assert.ok(option.hint.includes('Saved selection'))
  assert.ok(option.hint.includes('no matching regulation'))
  assert.ok(option.label.trim())
}
assert.equal(options.find((option) => option.value === 'saved-unknown-root').label, 'saved-unknown-root')

const sample = regulations[0]
const synthetic = [
  { ...sample, id: 'test-inactive', sectionRoot: 'TEST.ROOT ', title: '  Inactive\\n source\\t title  ', active: false },
  { ...sample, id: 'test-other', sectionRoot: 'TEST.ROOT ', title: 'Other title', active: true },
  { ...sample, id: 'test-distinct-raw', sectionRoot: 'TEST.ROOT', title: 'Separate exact root' },
  { ...sample, id: 'test-placeholder', sectionRoot: '---', title: 'An unrelated title' },
  { ...sample, id: 'test-empty', sectionRoot: '', title: 'Blank root' },
]
const syntheticOptions = regulationGroupOptions(synthetic)
assert.equal(syntheticOptions.length, 3, 'deduplicate only identical nonempty raw roots')
assert.equal(syntheticOptions.find((option) => option.value === 'TEST.ROOT ').label, 'TEST.ROOT ')
assert.ok(syntheticOptions.find((option) => option.value === 'TEST.ROOT ').hint.includes('Inactive source title'))
assert.ok(syntheticOptions.find((option) => option.value === 'TEST.ROOT ').hint.includes('Other title'))
assert.equal(syntheticOptions.find((option) => option.value === '---').label, 'Unspecified Section Root')
assert.ok(!syntheticOptions.find((option) => option.value === '---').hint.includes('An unrelated title'))
assert.ok(regulationGroupOptions(synthetic, ['']).find((option) => option.value === '').hint.includes('Saved blank Section Root'))
assert.equal(JSON.stringify([regulations, saved]), snapshot, 'source data and saved roots stay unchanged')
console.log('PASS: real3973/797 roots, complete title search, conflict/placeholder metadata, inactive records, exact roots, saved unknown/blank values, no mutation')
`,
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
