// Run with node scripts/check-basis-amendments.mjs. Uses the existing Vite/esbuild dependency.
import { build } from 'esbuild'
const result = await build({
  stdin: { resolveDir: process.cwd(), contents: `
    import assert from 'node:assert/strict'
    import { readFileSync } from 'node:fs'
    import { amendmentLabel } from './src/lib/gcpDisplay'
    import { amdtOrder, pickForLevel } from './src/lib/certBasisLevel'
    import { resolveBasisRule } from './src/lib/basisRuleSelection'
    import { planImport } from './src/lib/certBasisImport'
    import { useGcpFlowStore as store } from './src/stores/gcpFlowStore'
    const regs = JSON.parse(readFileSync('public/data/regulations.json', 'utf8'))
    const blank = regs.find(r => r.id === 'reg-3702')
    assert.equal(blank.section, '525.601')
    assert.equal(blank.amdt, '')
    assert.equal(amendmentLabel(blank.amdt), 'No amendment recorded')
    assert.equal(amendmentLabel('IR'), 'IR')
    assert.equal(amdtOrder(''), null)
    assert.equal(amdtOrder('IR'), 0)
    assert.equal(amendmentLabel('  '), 'No amendment recorded')
    assert.equal(resolveBasisRule(regs,'525.601','')?.id,blank.id)
    assert.equal(resolveBasisRule(regs,'525.601','')?.amdt,'')
    assert.equal(resolveBasisRule(regs,'23.1',''),null)
    assert.equal(resolveBasisRule(regs,'23.1','reg-5')?.amdt,'IR')
    assert.equal(resolveBasisRule(regs,'525.601','reg-5'),null)
    assert.equal(resolveBasisRule(regs,'UNKNOWN',''),null)
    const whitespace = {...blank,id:'whitespace-record',amdt:'  '}
    assert.equal(resolveBasisRule([whitespace],blank.section,'')?.amdt,'  ')
    const ir = {...blank, id: 'test-ir', amdt: 'IR'}
    const basis = {id:'test-basis', aircraftModel:'TEST', description:'Test', tcdsNumber:'', regulationIds:[]}
    const sheet = cells => [{name:'Sheet1', rows:[{n:2,cells}]}]
    const cells = [blank.section,'','', '', '', '', '', '']
    const plan = planImport(sheet(cells), basis, [blank,ir], [], [])
    assert.deepEqual(plan.errors, [])
    assert.deepEqual(plan.addIds, [blank.id])
    assert.equal(plan.newRegulations.length, 0)
    const repeated = planImport([{name:'Sheet1', rows:[{n:2,cells},{n:3,cells}]}],basis,[blank,ir],[],[])
    assert.deepEqual(repeated.addIds,[blank.id])
    assert.equal(repeated.skipped,1)
    const existing = planImport(sheet(cells), {...basis,regulationIds:[blank.id]}, [blank,ir],[],[])
    assert.equal(existing.addIds.length,0)
    const missing = planImport(sheet(['UNKNOWN','','','','','','','']),basis,[blank,ir],[],[])
    assert.equal(missing.errors.length,1)
    assert.equal(missing.newRegulations.length,0)
    assert.deepEqual(planImport(sheet([blank.section,'IR','','','','','','']),basis,[blank,ir],[],[]).addIds,[ir.id])
    const resolved = resolveBasisRule(regs,blank.section,'')
    const singleNonblank = regs.find(r=>r.amdt && regs.filter(v=>v.section===r.section).length===1)
    assert.equal(resolveBasisRule(regs,singleNonblank.section,'')?.id,singleNonblank.id)
    store.getState().saveBasis({...basis,regulationIds:[resolved.id]})
    const reopened = store.getState().bases.find(b => b.id===basis.id)
    assert.equal(reopened.regulationIds[0],blank.id)
    assert.equal(regs.find(r=>r.id===reopened.regulationIds[0]).amdt,'')
    assert.equal(pickForLevel([{...blank,sectionRoot:'25.0601'}],'25','latest')[0].chosen,null)
    console.log('PASS: unique blank/nonblank resolution and round-trip, multi-version ambiguity, IR distinction, wrong-ID rejection, exact import matching, duplicate skipping, no automatic level selection')
  `},
  bundle: true, platform: 'node', format: 'esm', write: false,
})
await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
