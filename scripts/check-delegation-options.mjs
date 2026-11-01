import { build } from 'esbuild'

const result = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: String.raw`
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { delegationOptions } from './src/lib/delegationOptions'
import { DELEGATIONS, FOC_LIST } from './src/lib/gcpFixtures'
import { DelegationDrawer } from './src/components/features/gcp/DelegationDrawer'
import { useGcpStore } from './src/stores/gcpStore'

const regulations = JSON.parse(readFileSync('public/data/regulations.json', 'utf8'))
const snapshot = JSON.stringify([regulations, DELEGATIONS, FOC_LIST])
const poolRoots = new Set(regulations.map((record) => record.sectionRoot))
assert.equal(DELEGATIONS.length, 720)
assert.equal(DELEGATIONS.filter((record) => !poolRoots.has(record.sectionRoot)).length, 226)
for (const saved of DELEGATIONS) {
  const options = delegationOptions(regulations, FOC_LIST, saved, saved)
  const root = options.sectionRoots.find((option) => option.value === saved.sectionRoot)
  const foc = options.focCodes.find((option) => option.value === saved.focCode)
  assert.ok(root, 'Saved root must stay visible: ' + saved.id)
  assert.ok(foc, 'Saved FOC must stay visible: ' + saved.id)
  assert.ok(root.label.trim())
  assert.deepEqual({ sectionRoot: root.value, focCode: foc.value }, {
    sectionRoot: saved.sectionRoot, focCode: saved.focCode,
  }, 'Picker values round-trip the exact saved identity')
  assert.equal(new Set(options.sectionRoots.map((option) => option.value)).size, options.sectionRoots.length)
}

const missing = DELEGATIONS.find((record) => !poolRoots.has(record.sectionRoot))
const original = { ...missing, sectionRoot: ' Legacy.ROOT  ', focCode: 'MISSING-FOC ' }
const current = { sectionRoot: 'CURRENT-ROOT', focCode: 'CURRENT-FOC' }
const retained = delegationOptions(regulations, FOC_LIST, original, current)
for (const value of [original.sectionRoot, current.sectionRoot]) {
  assert.ok(retained.sectionRoots.find((option) => option.value === value)?.hint.includes('Saved selection'))
}
for (const value of [original.focCode, current.focCode]) {
  assert.ok(retained.focCodes.find((option) => option.value === value)?.hint.includes('no matching FOC code'))
}
const emptyCreate = delegationOptions(regulations, FOC_LIST, undefined, { sectionRoot: '', focCode: '' })
assert.ok(!emptyCreate.sectionRoots.some((option) => option.value === ''))
assert.ok(!emptyCreate.focCodes.some((option) => option.value === ''))

// Render the actual form, using isolated process-only store state. This catches
// a picker showing its placeholder even though its saved value is retained.
useGcpStore.getInitialState().regulations = regulations
function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#x27;')
}
function triggerText(html, id) {
  const start = html.indexOf('id="' + id + '"')
  assert.ok(start >= 0)
  return html.slice(start, html.indexOf('</button>', start))
}
function render(saved) {
  return renderToStaticMarkup(createElement(DelegationDrawer, {
    mode: 'edit', initial: saved, onClose() {}, onSubmit() {},
  }))
}
const renderedMissing = render(missing)
assert.ok(triggerText(renderedMissing, 'delegation-section-root').includes(escapeHtml(missing.sectionRoot)))
const renderedUnknown = render(original)
assert.ok(triggerText(renderedUnknown, 'delegation-section-root').includes(escapeHtml(original.sectionRoot)))
assert.ok(triggerText(renderedUnknown, 'delegation-foc-code').includes(escapeHtml(original.focCode)))
for (const blank of ['', '  ']) {
  const saved = { ...original, sectionRoot: blank, focCode: blank }
  const options = delegationOptions(regulations, FOC_LIST, saved, saved)
  assert.equal(options.sectionRoots.find((option) => option.value === blank)?.value, blank)
  assert.equal(options.focCodes.find((option) => option.value === blank)?.value, blank)
  const markup = render(saved)
  assert.ok(triggerText(markup, 'delegation-section-root').includes('Blank saved Section Root'))
  assert.ok(triggerText(markup, 'delegation-foc-code').includes('Blank saved FOC Code'))
}
assert.equal(JSON.stringify([regulations, DELEGATIONS, FOC_LIST]), snapshot)
console.log('PASS: all720 saved delegation selections,226 roots absent from pool, exact raw values, current/original fallback, missing FOC, blank visibility, actual drawer rendering, no source mutation')
`,
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(process.cwd() + '/package.json');" },
  write: false,
})
try {
  await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
