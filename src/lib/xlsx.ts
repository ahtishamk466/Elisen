/**
 * A zero-dependency reader for plain `.xlsx` worksheets: the browser's own
 * `DecompressionStream` unzips, `DOMParser` reads the XML. It covers what an
 * import sheet holds (text, numbers, booleans, shared and inline strings) and
 * nothing else: no dates, styles or formulas beyond their cached value. A
 * number is read as Excel stores it, so a section typed as a number (23.10)
 * comes back as 23.1; import sheets keep such columns as text.
 *
 * Guarded against hostile files: only the entries a worksheet needs are
 * inflated, each is capped while it streams (a zip bomb stops at the cap),
 * and encrypted or Zip64 archives are refused.
 */
import { formatBytes } from './pdfCheck'

export interface XlsxSheet {
  name: string
  /** Rows in sheet order; `n` is Excel's 1-based row number. */
  rows: { n: number; cells: string[] }[]
}

const MAX_ENTRY_BYTES = 50 * 1024 * 1024
const ZIP_LOCAL = 0x04034b50
const ZIP_CENTRAL = 0x02014b50
const ZIP_END = 0x06054b50

class XlsxError extends Error {}

function centralDirectory(view: DataView) {
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i--) {
    if (view.getUint32(i, true) !== ZIP_END) continue
    const count = view.getUint16(i + 10, true)
    let at = view.getUint32(i + 16, true)
    if (count === 0xffff || at === 0xffffffff) throw new XlsxError('Zip64 archives are not supported.')
    const entries = new Map<string, { method: number; size: number; local: number; encrypted: boolean }>()
    for (let k = 0; k < count; k++) {
      if (view.getUint32(at, true) !== ZIP_CENTRAL) throw new XlsxError('The file is damaged.')
      const nameLength = view.getUint16(at + 28, true)
      const name = new TextDecoder().decode(new Uint8Array(view.buffer, at + 46, nameLength))
      entries.set(name, {
        encrypted: (view.getUint16(at + 8, true) & 1) === 1,
        method: view.getUint16(at + 10, true),
        size: view.getUint32(at + 20, true),
        local: view.getUint32(at + 42, true),
      })
      at += 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true)
    }
    return entries
  }
  throw new XlsxError('This is not an Excel (.xlsx) file.')
}

async function inflate(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_ENTRY_BYTES) {
      await reader.cancel()
      throw new XlsxError('The file unpacks to more than 50 MB.')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const c of chunks) { out.set(c, at); at += c.length }
  return out
}

function xml(text: string) {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) throw new XlsxError('The file is damaged.')
  return doc
}

/* Any namespace prefix: most files use the default namespace, a few `x:`. */
const all = (node: Document | Element, tag: string) => Array.from(node.getElementsByTagNameNS('*', tag))

const columnIndex = (ref: string) =>
  [...ref.replace(/\d+$/, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1

/** Every sheet's rows, first `columns` cells of each, trimmed. */
export async function readXlsx(file: File, columns: number): Promise<XlsxSheet[]> {
  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)
  if (buffer.byteLength < 22 || view.getUint32(0, true) !== ZIP_LOCAL) throw new XlsxError('This is not an Excel (.xlsx) file.')
  const entries = centralDirectory(view)

  const read = async (path: string): Promise<Document | null> => {
    const e = entries.get(path)
    if (!e) return null
    if (e.encrypted) throw new XlsxError('Password-protected files cannot be read.')
    const start = e.local + 30 + view.getUint16(e.local + 26, true) + view.getUint16(e.local + 28, true)
    const raw = new Uint8Array(buffer, start, e.size)
    if (e.method !== 0 && e.method !== 8) throw new XlsxError('The file uses an unsupported compression.')
    return xml(new TextDecoder().decode(e.method === 0 ? raw : await inflate(raw)))
  }

  const workbook = await read('xl/workbook.xml')
  const rels = await read('xl/_rels/workbook.xml.rels')
  if (!workbook || !rels) throw new XlsxError('This is not an Excel (.xlsx) file.')
  const targets = new Map(all(rels, 'Relationship').map((r) => [r.getAttribute('Id'), r.getAttribute('Target') ?? '']))
  const shared = all((await read('xl/sharedStrings.xml')) ?? xml('<sst/>'), 'si')
    .map((si) => all(si, 't').filter((t) => t.parentElement?.localName !== 'rPh').map((t) => t.textContent ?? '').join(''))

  const sheets: XlsxSheet[] = []
  for (const sheet of all(workbook, 'sheet')) {
    // `r:id`, whatever prefix the relationships namespace was given.
    const relId = Array.from(sheet.attributes).find((a) => a.localName === 'id' && a.namespaceURI)?.value
    const target = targets.get(relId ?? null) ?? ''
    const doc = await read(target.startsWith('/') ? target.slice(1) : `xl/${target}`)
    if (!doc) continue
    const rows = all(doc, 'row').map((row, i) => {
      const cells: string[] = Array(columns).fill('')
      all(row, 'c').forEach((c, k) => {
        const col = c.getAttribute('r') ? columnIndex(c.getAttribute('r')!) : k
        if (col < 0 || col >= columns) return
        const type = c.getAttribute('t')
        const v = all(c, 'v')[0]?.textContent ?? ''
        cells[col] = (type === 's' ? shared[Number(v)] ?? ''
          : type === 'inlineStr' ? all(c, 't').map((t) => t.textContent ?? '').join('')
            : type === 'b' ? (v === '1' ? 'TRUE' : 'FALSE') : v).trim()
      })
      return { n: Number(row.getAttribute('r')) || i + 1, cells }
    })
    sheets.push({ name: sheet.getAttribute('name') ?? `Sheet ${sheets.length + 1}`, rows })
  }
  return sheets
}

export const XLSX_MAX_BYTES = 10 * 1024 * 1024
const XLSX_TYPES = new Set(['', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])

/** Before reading: extension, the browser's MIME type, name length, size. */
export function checkXlsxFile(file: File): string | null {
  if (!/\.xlsx$/i.test(file.name)) return 'Only Excel files (.xlsx) can be imported.'
  if (!XLSX_TYPES.has(file.type)) return "This file isn't an Excel workbook."
  if (file.name.length > 200) return 'The file name is too long. Rename it to under 200 characters.'
  if (file.size === 0) return 'This file is empty.'
  if (file.size > XLSX_MAX_BYTES) return `This file is ${formatBytes(file.size)}. The limit is ${formatBytes(XLSX_MAX_BYTES)}.`
  return null
}

/** The reader's own messages are safe to show; anything else is not. */
export const xlsxMessage = (e: unknown) => (e instanceof XlsxError ? e.message : "The file couldn't be read.")
