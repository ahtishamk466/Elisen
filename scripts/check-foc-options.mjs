import { build } from 'esbuild'

const result = await build({ stdin: { resolveDir: process.cwd(), contents: `
import assert from 'node:assert/strict'
import { FOC_LIST, DELEGATIONS } from './src/lib/gcpFixtures'
import { focOptionsForRule } from './src/lib/focOptions'

const snapshot = JSON.stringify([FOC_LIST, DELEGATIONS])
assert.deepEqual(focOptionsForRule(FOC_LIST, DELEGATIONS, undefined), [], 'a regulation must be selected first')
const unspecified = focOptionsForRule(FOC_LIST, DELEGATIONS, '-')
assert.equal(unspecified.length, 55)
assert.ok(!unspecified.some((option) => option.value === 'AP-01'), 'Create must not offer an undelegated non-Default code')
assert.ok(focOptionsForRule(FOC_LIST, DELEGATIONS, '25.0031').some((option) => option.value === 'AP-01'))
const inactive = DELEGATIONS.find((d) => d.sectionRoot === '25.1301' && d.focCode === 'AP-08')
assert.ok(inactive && !inactive.active)
assert.ok(focOptionsForRule(FOC_LIST, DELEGATIONS, '25.1301').some((option) => option.value === 'AP-08'), 'preserve verified OLD inactive-delegation picker behavior')

for (const root of new Set(DELEGATIONS.map((d) => d.sectionRoot))) {
  const options = focOptionsForRule(FOC_LIST, DELEGATIONS, root)
  assert.equal(new Set(options.map((option) => option.value)).size, options.length)
  for (const foc of FOC_LIST.filter((f) => f.isDefault)) assert.ok(options.some((option) => option.value === foc.code))
}
const template = FOC_LIST[0]
const focs = [
  { ...template, code: 'DEFAULT', isDefault: true },
  { ...template, code: 'DELEGATE', isDefault: false },
  { ...template, code: 'OUTSIDE', isDefault: false },
]
const delegations = [
  { id: 'one', sectionRoot: 'ROOT', focCode: 'DELEGATE', active: false, limitation: true },
  { id: 'two', sectionRoot: 'ROOT', focCode: 'DEFAULT', active: true, limitation: false },
]
assert.deepEqual(focOptionsForRule(focs, delegations, 'ROOT').map((option) => option.value), ['DEFAULT', 'DELEGATE'])
assert.deepEqual(focOptionsForRule(focs, delegations, 'OTHER').map((option) => option.value), ['DEFAULT'])
assert.deepEqual(focOptionsForRule(focs, delegations.filter((d) => d.focCode !== 'DELEGATE'), 'ROOT').map((option) => option.value), ['DEFAULT'])
assert.equal(JSON.stringify([FOC_LIST, DELEGATIONS]), snapshot)
console.log('PASS: shared FOC choices, rule-specific delegates/Default fallback, inactive legacy behavior, no duplicates, no selected rule, no data mutation')
` }, bundle: true, platform: 'node', format: 'esm', write: false })
await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
