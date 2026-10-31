import { build } from 'esbuild'

const result = await build({ stdin: { resolveDir: process.cwd(), contents: `
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { subsectionsForSubpart, regulationsForTopic, selectedRegulationTopic } from './src/lib/regulationStructure'
const regs = JSON.parse(readFileSync('public/data/regulations.json', 'utf8'))
const topics = JSON.parse(readFileSync('public/data/subsections.json', 'utf8'))
const before = JSON.stringify([regs, topics])
const codes = [...new Set(regs.map(r => r.subpartCode))]
for (const code of codes) {
  const available = subsectionsForSubpart(code, topics, regs).map(t => t.code)
  for (const r of regs.filter(r => r.subpartCode === code)) {
    assert.ok(available.includes(r.subsectionCode), 'Saved classification must stay discoverable: ' + r.id)
    assert.ok(regulationsForTopic(code, r.subsectionCode, regs).some(x => x.id === r.id))
  }
}
const general = regulationsForTopic('C', 'C01', regs)
assert.ok(general.some(r => r.id === 'reg-1420' && r.amdt === '25-23'))
assert.ok(general.some(r => r.id === 'reg-1423' && r.amdt === 'IR'))
assert.ok(general.every(r => r.subpartCode === 'C' && r.subsectionCode === 'C01'))
assert.ok(subsectionsForSubpart('K', topics, regs).some(t => t.code === 'F01'))
assert.ok(subsectionsForSubpart('SC', topics, regs).some(t => t.code === '-'))
const blank = regs.find(r => r.amdt === '')
assert.ok(regulationsForTopic(blank.subpartCode, blank.subsectionCode, regs).some(r => r.id === blank.id && r.amdt === ''))
assert.deepEqual(regulationsForTopic('does-not-exist', 'C01', regs), [])
assert.equal(selectedRegulationTopic('B', 'C', 'C01', topics), undefined,
  'a filtered-away C parent must not carry C01 into fallback parent B')
assert.equal(selectedRegulationTopic('C', 'C', 'C01', topics)?.code, 'C01',
  'clearing the filter restores the explicitly selected parent/topic')
assert.equal(selectedRegulationTopic('K', 'K', 'F01', topics)?.code, 'F01',
  'explicit cross-prefix pairs remain valid')
const createdTopic = { ...topics[0], id: 'test-new-topic', code: 'TEST99' }
assert.equal(selectedRegulationTopic('K', 'K', 'TEST99', [...topics, createdTopic]), createdTopic,
  'explicit newly created context does not depend on a saved regulation pair or prefix')
assert.equal(selectedRegulationTopic('C', null, 'C01', topics), undefined)
assert.equal(selectedRegulationTopic('C', 'C', 'missing', topics), undefined)
assert.equal(JSON.stringify([regs, topics]), before)
console.log('PASS: saved classifications, cross-prefix/placeholder/new topics, filtered-parent isolation, exact amendments/blank IDs, empty results, no data mutation')
` }, bundle: true, platform: 'node', format: 'esm', write: false })
await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
