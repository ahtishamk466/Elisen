import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL } from '@/lib/projectDisplay'
import type { ProjectListRow } from '@/types/project'

const COLUMNS: { header: string; get: (r: ProjectListRow) => string | number }[] = [
  { header: 'Number', get: (r) => `${r.number}-${r.subNumber}` },
  { header: 'Type', get: (r) => TYPE_LABEL[r.type] },
  { header: 'Project', get: (r) => r.title },
  { header: 'Company', get: (r) => r.companyName },
  { header: 'Contact', get: (r) => r.contactName },
  { header: 'Person Responsible', get: (r) => r.personResponsible },
  { header: 'Actual Hours', get: (r) => r.actualHours },
  { header: 'Budget Hours', get: (r) => r.budgetHours },
  { header: 'Priority', get: (r) => PRIORITY_LABEL[r.priority] },
  { header: 'Status', get: (r) => STATUS_LABEL[r.status] },
]

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function csvEscape(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportRowsAsCsv(rows: ProjectListRow[]) {
  const lines = [
    COLUMNS.map((c) => csvEscape(c.header)).join(','),
    ...rows.map((r) => COLUMNS.map((c) => csvEscape(c.get(r))).join(',')),
  ]
  downloadBlob(lines.join('\n'), 'projects.csv', 'text/csv;charset=utf-8')
}

export function exportRowsAsText(rows: ProjectListRow[]) {
  const widths = COLUMNS.map((c) => Math.max(c.header.length, ...rows.map((r) => String(c.get(r)).length)))
  const pad = (s: string, w: number) => s.padEnd(w, ' ')
  const lines = [
    COLUMNS.map((c, i) => pad(c.header, widths[i])).join('  '),
    widths.map((w) => '-'.repeat(w)).join('  '),
    ...rows.map((r) => COLUMNS.map((c, i) => pad(String(c.get(r)), widths[i])).join('  ')),
  ]
  downloadBlob(lines.join('\n'), 'projects.txt', 'text/plain;charset=utf-8')
}

export function exportRowsAsHtml(rows: ProjectListRow[]) {
  const thead = `<tr>${COLUMNS.map((c) => `<th>${c.header}</th>`).join('')}</tr>`
  const tbody = rows
    .map((r) => `<tr>${COLUMNS.map((c) => `<td>${c.get(r)}</td>`).join('')}</tr>`)
    .join('')
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Projects</title>
<style>table{border-collapse:collapse;font-family:sans-serif;font-size:14px}
th,td{border:1px solid #E2E8F0;padding:8px 12px;text-align:left}
th{background:#F8FAFC}</style></head>
<body><table><thead>${thead}</thead><tbody>${tbody}</tbody></table></body></html>`
  downloadBlob(html, 'projects.html', 'text/html;charset=utf-8')
}
