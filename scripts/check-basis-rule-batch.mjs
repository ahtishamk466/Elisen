import {build} from 'esbuild'
const result=await build({stdin:{resolveDir:process.cwd(),contents:`
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {appendBasisRules} from './src/lib/basisRuleBatch'
import {duplicateSections} from './src/lib/certBasisLevel'
const regs=JSON.parse(readFileSync('public/data/regulations.json','utf8'))
const blank=regs.find(r=>r.id==='reg-3702'),ir=regs.find(r=>r.id==='reg-5'),alternate=regs.find(r=>r.id==='reg-4')
const batch=appendBasisRules([], [blank.id,ir.id,alternate.id,blank.id,'missing'],regs)
assert.deepEqual(batch.ids,[blank.id,ir.id,alternate.id])
assert.equal(regs.find(r=>r.id===batch.ids[0]).amdt,'')
assert.equal(ir.amdt,'IR')
assert.equal(duplicateSections(batch.ids.map(id=>regs.find(r=>r.id===id))).length,1)
assert.deepEqual(appendBasisRules([ir.id],[ir.id,blank.id],regs,[blank.id]).ids,[ir.id])
assert.deepEqual(appendBasisRules([],[blank.id],regs).ids,[blank.id])
assert.deepEqual(appendBasisRules(['preserve-current-unknown'],[],regs).ids,['preserve-current-unknown'])
assert.deepEqual(appendBasisRules([],['missing'],regs).additions,[])
console.log('PASS: batch exact IDs, different sections/versions, blank/IR distinction, duplicates, existing IDs, missing ID, single record and alternate-version warning')
`},bundle:true,platform:'node',format:'esm',write:false})
await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
