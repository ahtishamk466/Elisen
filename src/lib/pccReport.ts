import { downloadBlob } from './exportRows'
import { TCCA_CHECKLIST } from './tccaChecklist'
import { DOC_STATE_LABEL, INVOLVEMENT_LABEL, TCCA_STATUS_LABEL } from './tccaDisplay'
import type { ProjectListRow } from '@/types/project'
import type { DeliverableRevision, TccaDocLink, TccaProject } from '@/types/tcca'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * The Project Completion Checklist — the client's official record of whether
 * their TCCA process was followed: comments/next action, related Elisen
 * projects, every checklist item's status, and the document interactions.
 */
export function downloadCompletionChecklist(
  tcca: TccaProject,
  linkedProjects: ProjectListRow[],
  links: { link: TccaDocLink; revision: DeliverableRevision }[],
) {
  const checklistRows = TCCA_CHECKLIST.map((phase) => {
    const items = phase.items.map((item) => {
      const applicable = item.id in tcca.checklist
      const date = tcca.checklist[item.id] ?? ''
      const status = !applicable ? 'Not applicable' : date ? `Completed ${date}` : 'Applicable, not complete'
      return `<tr><td>${esc(item.label)}</td><td>${status}</td></tr>`
    }).join('')
    return `<tr class="phase"><td colspan="2">${esc(phase.title)}</td></tr>${items}`
  }).join('')

  const docRows = links.map(({ link, revision }) =>
    `<tr><td>${esc(revision.number)} rev ${esc(revision.rev)}</td><td>${esc(revision.title)}</td><td>${INVOLVEMENT_LABEL[link.involvement]}</td><td>${link.sentDate || '—'}</td><td>${DOC_STATE_LABEL[link.state]}</td></tr>`,
  ).join('')

  const html = `<meta charset="utf-8"><title>Project Completion Checklist: ${esc(tcca.number)}</title>
<style>
  body{font-family:system-ui,sans-serif;color:#020617;margin:40px;max-width:900px}
  h1{font-size:24px}h2{font-size:16px;margin-top:32px}
  table{border-collapse:collapse;width:100%;font-size:14px}
  td,th{border:1px solid #E2E8F0;padding:6px 10px;text-align:left}
  tr.phase td{background:#F1F5F9;font-weight:600}
  p.meta{color:#334155;font-size:14px}
</style>
<h1>Project Completion Checklist: ${esc(tcca.number)}</h1>
<p class="meta">${esc(tcca.description)}</p>
<p class="meta">Status: ${TCCA_STATUS_LABEL[tcca.status]} · Opened ${tcca.openedDate}${tcca.closedDate ? ` · Closed ${tcca.closedDate}` : ''}</p>
<h2>Related Elisen Projects</h2>
<p class="meta">${linkedProjects.length ? linkedProjects.map((p) => `${p.number}-${p.subNumber}: ${esc(p.title)}`).join('<br>') : 'None, baseline / DAO organizational work.'}</p>
<h2>Next Action</h2><p class="meta">${esc(tcca.nextAction || '—')}</p>
<h2>Comments</h2><p class="meta">${esc(tcca.comments || '—')}</p>
<h2>Checklist</h2>
<table><tr><th>Task</th><th>Status</th></tr>${checklistRows}</table>
<h2>Documents: Transport Canada Interactions</h2>
${links.length ? `<table><tr><th>Number</th><th>Title</th><th>Involvement</th><th>Sent</th><th>Status</th></tr>${docRows}</table>` : '<p class="meta">No documents linked.</p>'}`

  downloadBlob(html, `project-completion-checklist-${tcca.number}.html`, 'text/html;charset=utf-8')
}
