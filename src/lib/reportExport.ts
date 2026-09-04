import { downloadBlob } from './exportRows'
import type { ReportResult } from './reportGenerators'

/**
 * One `ReportResult` in, one file out — five formats from the same object the
 * preview pane rendered, so the file can never disagree with what was on
 * screen.
 *
 * Excel and PDF are deliberately zero-dependency (docs/SECURITY.md rule 7):
 * - **Excel** downloads an HTML-table workbook served as
 *   `application/vnd.ms-excel` with an `.xls` extension — the classic
 *   library-free interchange format Excel has opened for twenty years. Excel
 *   shows a one-time "format doesn't match extension" prompt and then renders
 *   it as a normal sheet. Swapping in a real `.xlsx` writer later only
 *   touches this file.
 * - **PDF** prints a paper-styled copy of the report through the browser's
 *   own print dialog ("Save as PDF") via a hidden iframe — the one PDF
 *   generator every browser already ships.
 */
export type ReportFormat = 'excel' | 'pdf' | 'csv' | 'text' | 'html'

export const FORMAT_LABEL: Record<ReportFormat, string> = {
  excel: 'Excel', pdf: 'PDF', csv: 'CSV', text: 'Text', html: 'HTML',
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Same document style as the Project Completion Checklist (lib/pccReport.ts). */
function htmlDocument(r: ReportResult): string {
  const head = `<tr>${r.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>`
  const body = r.rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')
  return `<meta charset="utf-8"><title>${esc(r.title)}</title>
<style>
  body{font-family:system-ui,sans-serif;color:#020617;margin:40px;max-width:1000px}
  h1{font-size:24px}
  table{border-collapse:collapse;width:100%;font-size:14px}
  td,th{border:1px solid #E2E8F0;padding:6px 10px;text-align:left;vertical-align:top}
  th{background:#F8FAFC}
  p.meta{color:#334155;font-size:14px}
  p.range{color:#020617;font-size:15px;font-weight:600;margin-bottom:4px}
  @media print{body{margin:0}}
</style>
<h1>${esc(r.title)}</h1>
${r.range ? `<p class="range">${esc(r.range)}</p>` : ''}
<p class="meta">${esc(r.meta)}</p>
${r.rows.length ? `<table>${head}${body}</table>` : '<p class="meta">No matching records.</p>'}`
}

const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

function csvContent(r: ReportResult): string {
  return [r.columns.map(csvEscape).join(','), ...r.rows.map((row) => row.map(csvEscape).join(','))].join('\n')
}

function textContent(r: ReportResult): string {
  const widths = r.columns.map((c, i) => Math.max(c.length, ...r.rows.map((row) => row[i].length)))
  const line = (cells: string[]) => cells.map((v, i) => v.padEnd(widths[i], ' ')).join('  ')
  return [
    r.range ? `${r.title} — ${r.range} — ${r.meta}` : `${r.title} — ${r.meta}`, '',
    line(r.columns), widths.map((w) => '-'.repeat(w)).join('  '),
    ...r.rows.map(line),
  ].join('\n')
}

/** Prints through a hidden iframe so no popup blocker is in the way; the
    user picks "Save as PDF" in the browser's own dialog. */
function printAsPdf(r: ReportResult) {
  const frame = document.createElement('iframe')
  frame.style.display = 'none'
  frame.srcdoc = htmlDocument(r)
  frame.onload = () => {
    frame.contentWindow?.print()
    /* Removed on a delay: pulling the frame while the dialog is open blanks
       the print job in some browsers. */
    setTimeout(() => frame.remove(), 60_000)
  }
  document.body.appendChild(frame)
}

/** Returns the toast line to show, since PDF's flow differs from a plain
    file download and the message has to say so. */
export function downloadReportAs(r: ReportResult, format: ReportFormat): string {
  switch (format) {
    case 'html':
      downloadBlob(htmlDocument(r), `${r.filenameBase}.html`, 'text/html;charset=utf-8')
      break
    case 'csv':
      downloadBlob(csvContent(r), `${r.filenameBase}.csv`, 'text/csv;charset=utf-8')
      break
    case 'text':
      downloadBlob(textContent(r), `${r.filenameBase}.txt`, 'text/plain;charset=utf-8')
      break
    case 'excel':
      downloadBlob(htmlDocument(r), `${r.filenameBase}.xls`, 'application/vnd.ms-excel')
      break
    case 'pdf':
      printAsPdf(r)
      return `"${r.title}" sent to print — choose "Save as PDF" in the dialog.`
  }
  return `"${r.title}" downloaded as ${FORMAT_LABEL[format]}.`
}
