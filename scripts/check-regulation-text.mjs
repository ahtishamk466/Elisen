import { build } from 'esbuild'
const result = await build({
  stdin: {resolveDir:process.cwd(),contents:`
    import assert from 'node:assert/strict'
    import { readFileSync } from 'node:fs'
    import { regulationTextBlocks } from './src/lib/regulationText'
    const decode = s => s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&frac12;/g,'½')
    const blocks = regulationTextBlocks('<p>(a) General &amp; scope</p>\\\\r\\\\n<p>(1) First<br />(i) Nested</p>',decode)
    assert.deepEqual(blocks.map(b=>b.text),['(a) General & scope','(1) First','(i) Nested'])
    assert.deepEqual(blocks.map(b=>b.indent),['none','number','roman'])
    assert.deepEqual(regulationTextBlocks('Plain text\\n\\n(a) Next paragraph',decode).map(b=>b.text),['Plain text','(a) Next paragraph'])
    const hostile = '<script>alert(1)</script><style>body{}</style><iframe src="bad">bad</iframe><p onclick="bad()">Safe<img src="bad" onerror="bad()"/><a href="javascript:bad()">link</a></p>'
    assert.deepEqual(regulationTextBlocks(hostile,decode).map(b=>b.text),['Safelink'])
    const regs=JSON.parse(readFileSync('public/data/regulations.json','utf8'))
    const real=regs.find(r=>r.id==='reg-2324')
    const formatted=regulationTextBlocks(real.requirementText,decode)
    assert(formatted.length>10)
    assert(formatted.some(b=>b.text.startsWith('(1)')))
    assert(formatted.every(b=>!b.text.includes('<p>')&&!b.text.includes('\\\\r\\\\n')))
    const inline=regs.find(r=>r.section==='23.1' && r.amdt==='23-34')
    const clauses=regulationTextBlocks(inline.requirementText,decode)
    assert.equal(clauses.length,2)
    assert(clauses[0].text.startsWith('[(a) This Part'))
    assert(clauses[0].text.endsWith('categories.]'))
    assert(clauses[1].text.startsWith('(b) Each person'))
    const originalWords=inline.requirementText.replace(/<[^>]*>/g,'').replace(/\\\\r\\\\n/g,' ').trim().split(/\\s+/)
    assert.deepEqual(clauses.map(b=>b.text).join(' ').split(/\\s+/),originalWords)
    assert.deepEqual(regulationTextBlocks('The following apply: (1) First requirement; (2) Second requirement. (i) Nested clause.',decode).map(b=>b.text),[
      'The following apply:', '(1) First requirement;', '(2) Second requirement.', '(i) Nested clause.'
    ])
    for(const reference of ['See paragraph (a) of this section.', 'Compliance under (a) and (b) is required.', 'Use the criteria in paragraph (1) or paragraph (2).']) {
      assert.deepEqual(regulationTextBlocks(reference,decode).map(b=>b.text),[reference])
    }
    assert.deepEqual(regulationTextBlocks('',decode),[])
    console.log('PASS: real inline 23.1 clauses and exact wording, cross-reference preservation, long clauses, inert hostile markup, empty text')
  `},bundle:true,platform:'node',format:'esm',write:false,
})
await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
