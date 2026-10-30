/** Largest PDF the app keeps. A TCDS is usually well under 2 MB. */
export const PDF_MAX_BYTES = 20 * 1024 * 1024
const NAME_MAX = 200
const PDF_TYPES = new Set(['', 'application/pdf', 'application/x-pdf'])

/* PDF names that make a file run something or carry another file: scripts,
   launch actions, embedded files, rich media. A government TCDS has none. */
const ACTIVE_NAMES = new Set(['JavaScript', 'JS', 'Launch', 'EmbeddedFile', 'EmbeddedFiles', 'RichMedia'])

export function formatBytes(n: number) {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${Number((n / 1024 / 1024).toFixed(1))} MB`
}

/**
 * Checks a picked file before it's kept as a PDF, cheapest check first:
 * extension, name length, the browser's MIME type, size, the file's own
 * `%PDF-` signature (a renamed .exe or .html fails here), then active content
 * in the PDF's dictionaries (names decoded from `#xx` escapes). Returns the
 * problem in plain words, or `null` when the file passes.
 *
 * A convenience, not a security boundary: stream bodies aren't decompressed,
 * so a script hidden in an object stream gets through. The server must
 * repeat every check and virus-scan before storing (docs/DECISIONS.md).
 */
export async function checkPdf(file: File): Promise<string | null> {
  if (!/\.pdf$/i.test(file.name)) return 'Only PDF files (.pdf) can be uploaded.'
  if (file.name.length > NAME_MAX) return `The file name is too long. Rename it to under ${NAME_MAX} characters.`
  if (!PDF_TYPES.has(file.type)) return "This file isn't a PDF."
  if (file.size === 0) return 'This file is empty.'
  if (file.size > PDF_MAX_BYTES) return `This file is ${formatBytes(file.size)}. The limit is ${formatBytes(PDF_MAX_BYTES)}.`

  let text: string
  try {
    text = new TextDecoder('latin1').decode(await file.arrayBuffer())
  } catch {
    return "This file couldn't be read. Pick it again."
  }
  if (!text.startsWith('%PDF-')) return "This file isn't a real PDF: its contents don't match the .pdf name."

  /* Dictionaries only: a stream body is compressed bytes, where a run like
     `/JS ` can turn up by chance. */
  const dictionaries = text.split('endstream').map((part) => part.split(/stream\r?\n/)[0]).join('\n')
  for (const [, raw] of dictionaries.matchAll(/\/([^\s/[\]<>(){}%]+)/g)) {
    const name = raw.replace(/#([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    if (ACTIVE_NAMES.has(name)) {
      return 'This PDF contains scripts or embedded files, which aren\'t allowed. Save a plain copy (Print, then Save as PDF) and upload that.'
    }
  }
  return null
}
