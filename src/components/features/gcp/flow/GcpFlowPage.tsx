import { amendmentLabel } from '@/lib/gcpDisplay'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, FolderKanban, Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { Stepper } from '@/components/patterns/Stepper'
import { Stat } from '@/components/patterns/Stat'
import { DateText } from '@/components/patterns/DateText'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useTccaStore } from '@/stores/tccaStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { FlowStepProject } from './FlowStepProject'
import { FlowStepBasis } from './FlowStepBasis'
import { FlowStepInitialize } from './FlowStepInitialize'
import { FlowStepPlan } from './FlowStepPlan'
import { FlowStepReports } from './FlowStepReports'
import { ReadOnlyField } from './ReadOnlyField'
import { CreateGcpDrawer } from './CreateGcpDrawer'
import { isOpenableUrl } from '@/components/patterns/UrlField'
import { sourceLabel } from '@/lib/gcpDisplay'
import { projectPlan } from '@/lib/projectPlan'
import { GcpDataGate } from '../GcpDataGate'

export const FLOW_STEPS = [
  'Project',
  'Certification Basis',
  'Scope Rules',
  'Compliance Plan',
  'Reports',
] as const

/**
 * GCP as one route instead of twenty menu entries: the work runs forward
 * through five steps, and each step is only reachable once the one before it
 * has produced what it needs.
 *
 * Step 2 is the merge the client asked for — the legacy `Master Cert Basis`
 * (aircraft model, type certificate) and `Cert Basis` (the regulations, each
 * with its amendment, title and codes) on one screen, linked to the project
 * there rather than on a separate Associate screen.
 */
export function GcpFlowPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const projects = useProjectsStore((s) => s.rows)
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const bases = useGcpFlowStore((s) => s.bases)
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const planEntries = useGcpFlowStore((s) => s.planEntries)

  const projectId = searchParams.get('project') ?? ''
  const project = tccaProjects.find((t) => t.id === projectId) ?? null
  const basisId = project ? projectBasis[project.id] : undefined
  const projectEntries = projectPlan(planEntries, projectId, bases.find((b) => b.id === basisId))
  const affected = projectEntries.filter((e) => e.affected)
  const complete = affected.filter((e) => e.complete)

  /* Step 4 walks one affected rule at a time; the index lives here (not
     inside FlowStepPlan) because the persistent summary card above it also
     needs to know which rule is current, to swap its stat band for that
     rule's own identity fields. */
  const [planIndex, setPlanIndex] = useState(0)
  /* "Create GCP" — step 1's own header CTA, a quick-pick alternative to
     scanning the table below for the same row-click entry point. */
  const [createOpen, setCreateOpen] = useState(false)
  /* Step 1's own search, lifted up here from `FlowStepProject` — the box
     now lives in the page header next to the one heading this step shows
     (client instruction, 2026-09-24), so this page owns the query and
     `FlowStepProject` just reads it. */
  const [projectQuery, setProjectQuery] = useState('')

  const planRows = affected
    .map((e) => ({ entry: e, rule: regulations.find((r) => r.id === e.regulationId) }))
    .filter((row): row is { entry: typeof affected[number]; rule: NonNullable<typeof row.rule> } => !!row.rule)
  const currentPlanRow = planRows[Math.min(planIndex, planRows.length - 1)]
  const currentSubpart = currentPlanRow && subparts.find((sp) => sp.code === currentPlanRow.rule.subpartCode)
  const currentSubsection = currentPlanRow && subsections.find((ss) => ss.code === currentPlanRow.rule.subsectionCode)

  const elisenProject = project ? projects.find((p) => p.id === project.projectIds[0]) : undefined
  const elisenProjectLabel = !project ? '—'
    : elisenProject ? `${elisenProject.number}-${elisenProject.subNumber}${project.projectIds.length > 1 ? ` +${project.projectIds.length - 1}` : ''}`
    : project.projectIds.length ? '—' : 'Baseline / DAO'

  /* A step is open only when the step before it has produced something: no
     basis, no rules to scope; nothing scoped, no plan to write. */
  const reachable = [true, !!project, !!basisId, projectEntries.length > 0, affected.length > 0]
  const requested = Number(searchParams.get('step') ?? 1)
  const step = Math.min(Math.max(requested, 1), reachable.filter(Boolean).length)

  const go = (next: number, patch?: Record<string, string>) => {
    const p = new URLSearchParams(searchParams)
    p.set('step', String(next))
    Object.entries(patch ?? {}).forEach(([k, v]) => p.set(k, v))
    setSearchParams(p, { replace: true })
  }

  const isComplete = project && affected.length > 0 && affected.every((e) => e.complete)
  const gcpProgress: { label: string; tone: BadgeTone } | null = !project ? null
    : projectEntries.length === 0 ? { label: 'Not Started', tone: 'neutral' }
    : isComplete ? { label: 'Complete', tone: 'success' }
    : { label: 'In Progress', tone: 'warning' }

  return (
    <AppShell
      activeItem="General Certification"
      activeChild="Certification Projects"
      title="Certification Projects"
      /* Step 1 showed two headings stacked — this page's own "Certification
         Flow" title, then `FlowStepProject`'s own "All Projects" heading
         right under it — client instruction, 2026-09-24: one heading only.
         The count pill and description that used to sit under the second
         heading move up into this one instead, and `FlowStepProject` no
         longer renders a heading of its own. Steps 2-5 keep the existing
         "Back to all projects" override. */
      headerLeft={step > 1 && project ? (
        <button
          type="button"
          onClick={() => go(1)}
          className="inline-flex items-center gap-sm rounded-sm text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ArrowLeft size={18} aria-hidden />
          Back to all projects
        </button>
      ) : step === 1 ? (
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text-primary">Certification Projects</h1>
          <p className="mt-xxss text-sm text-text-secondary">Choose a TCCA project to build its General Certification Plan (GCP).</p>
        </div>
      ) : undefined}
      /* Step 1 is a plain landing table, not a wizard step — its search
         (moved up from `FlowStepProject`, same reason as the heading above)
         and its own CTA, opposite the heading (client instruction,
         2026-09-24). Steps 2-5 show no header action; the flow itself is
         the action. */
      headerActions={step === 1 ? (
        <>
          <div className="min-w-0" style={{ width: 280 }}>
            <label htmlFor="flow-project-search" className="sr-only">Search projects</label>
            <Input id="flow-project-search" size="sm" leadingIcon={<Search size={16} />} placeholder="Search by number or description..."
              value={projectQuery} onChange={(e) => setProjectQuery(e.target.value)} />
          </div>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create GCP</Button>
        </>
      ) : undefined}
      /* Every step fills the viewport instead of letting the browser window
         itself scroll: the stepper and project summary card stay put, and
         whatever's below them — a table (step 1, step 3) or a tall form
         (step 2, 4, 5) — is the one thing that scrolls, in its own pane.
         Step 4 (Compliance Plan) is the one exception: two rich-text editors,
         the DDS fields and a growing GCP Data table add up to more than a
         cramped internal pane can show at once, so that step hands scroll
         back to the browser window instead of boxing itself in. */
      fill={step !== 4}
    >
      <GcpDataGate>
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        {/* Step 1 is the plain "pick a project" landing table — no stepper,
            since nothing's been started yet. The stepper only makes sense
            once a project's been picked and the wizard is actually running,
            steps 2-5 (client instruction, 2026-09-24). */}
        {step > 1 && (
          <div className="shrink-0 rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
            <Stepper steps={[...FLOW_STEPS]} current={step - 1} />
          </div>
        )}

        {/* The project the reader picked in step 1 stays visible and
            identifiable on every step after it — identity and every figure
            that matters for it in one card, header on white and the figures
            on a tinted band underneath (the same shape as a Person or Project
            detail header), so going back never means losing track of which
            project this work belongs to or how far its GCP has gotten. */}
        {step > 1 && project && (
          <section aria-label={`${project.number} summary`} className="shrink-0 overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            <header className="flex flex-wrap items-center gap-sm px-lg py-lg">
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-accent">
                <FolderKanban size={22} />
              </span>
              <div className="min-w-0 flex-1">
                {/* Step 4 has a third element in this row — the Prev/Select/Next
                    rule nav — which pushes a top-right badge all the way past
                    it, stranding it in the gap between the title and the nav.
                    There, the status sits right after the title instead: 16px
                    gap (`gap-lg`), same line, never wrapping under it. */}
                <div className="flex items-center gap-lg">
                  <h1 className="truncate text-xl font-semibold text-text-primary">{project.number}</h1>
                  {step === 4 && gcpProgress && <Badge tone={gcpProgress.tone}>{gcpProgress.label}</Badge>}
                </div>
                <p className="truncate text-sm text-text-secondary">{project.description}</p>
              </div>
              {/* Every other step has nothing else in this row, so the status
                  pins to the top-right corner of the card instead — same
                  placement as TccaProjectDetailPage's header. */}
              {step !== 4 && gcpProgress && (
                <div className="shrink-0 self-start">
                  <Badge tone={gcpProgress.tone}>{gcpProgress.label}</Badge>
                </div>
              )}
              {step === 4 && currentPlanRow && (
                <div className="flex shrink-0 items-center gap-base">
                  <p className="whitespace-nowrap text-sm text-text-secondary">Reg {planIndex + 1} of {planRows.length}</p>
                  {/* One joined control, same shape as `PhoneInput`'s code+number
                      box: a single bordered strip with the dropdown as its
                      `bare` middle segment, divided into its three chunks by
                      the segment borders rather than gaps between controls. */}
                  <div className="flex h-9 items-center overflow-hidden rounded-sm border border-border-default bg-neutral-25">
                    <Button
                      variant="tertiary"
                      size="sm"
                      disabled={planIndex === 0}
                      onClick={() => setPlanIndex((i) => i - 1)}
                      className="!h-full !rounded-none !border-transparent border-r !border-r-border-default px-base !no-underline hover:bg-neutral-50"
                    >
                      ← Prev
                    </Button>
                    <div className="h-full min-w-0" style={{ width: 200 }}>
                      <SearchableSelect
                        id="plan-select-rule"
                        variant="bare"
                        size="sm"
                        ariaLabel="Select a rule"
                        value={currentPlanRow.entry.id}
                        onChange={(id) => setPlanIndex(planRows.findIndex((r) => r.entry.id === id))}
                        placeholder="Select…"
                        options={planRows.map((r) => ({ value: r.entry.id, label: `${r.rule.section} · ${amendmentLabel(r.rule.amdt)}`, hint: r.rule.title }))}
                      />
                    </div>
                    <Button
                      variant="tertiary"
                      size="sm"
                      disabled={planIndex === planRows.length - 1}
                      onClick={() => setPlanIndex((i) => i + 1)}
                      className="!h-full !rounded-none !border-transparent border-l !border-l-border-default px-base !no-underline hover:bg-neutral-50"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              )}
            </header>

            {/* Step 4 walks one rule at a time — the identity that matters
                there is the rule's, not the project's overall counts, so
                this band swaps to the same fields FlowStepPlan's own sticky
                nav sits above. */}
            <div className="rounded-sm bg-neutral-100" style={{ margin: 3 }}>
              {step === 4 && currentPlanRow ? (
                <dl className="grid grid-cols-3 gap-2xl px-lg py-lg">
                  <ReadOnlyField label="Subpart Code">{currentPlanRow.rule.subpartCode}</ReadOnlyField>
                  <ReadOnlyField label="Subpart Description">{currentSubpart?.description}</ReadOnlyField>
                  <ReadOnlyField label="Subsection Code">{currentPlanRow.rule.subsectionCode}</ReadOnlyField>
                  <ReadOnlyField label="Subsection Title">{currentSubsection?.title}</ReadOnlyField>
                  <ReadOnlyField label="Regulation Section">{currentPlanRow.rule.section}</ReadOnlyField>
                  <ReadOnlyField label="Regulation Amendment">{amendmentLabel(currentPlanRow.rule.amdt)}</ReadOnlyField>
                  <ReadOnlyField label="Regulation Title">{currentPlanRow.rule.title}</ReadOnlyField>
                  <div className="min-w-0">
                    <dt className="text-xs font-normal text-text-muted">Regulation Url</dt>
                    <dd className="mt-xxss">
                      {isOpenableUrl(currentPlanRow.rule.url) ? (
                        <a href={currentPlanRow.rule.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-xxss text-sm font-medium text-accent underline underline-offset-2 transition-colors duration-fast hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                          {sourceLabel(currentPlanRow.rule.url)}
                          <ExternalLink size={14} aria-hidden className="shrink-0" />
                          <span className="sr-only"> for {currentPlanRow.rule.section} at {amendmentLabel(currentPlanRow.rule.amdt)}, opens in a new tab</span>
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-text-muted">No source</span>
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <dl className="grid gap-2xl px-lg py-lg mobile:grid-cols-2 tablet:grid-cols-3 laptop:grid-cols-5">
                  <Stat dl label="Elisen Project" nowrap>{elisenProjectLabel}</Stat>
                  <Stat dl label="Applicable rules">{projectEntries.length || undefined}</Stat>
                  <Stat dl label="Affected rules">{affected.length || undefined}</Stat>
                  <Stat dl label="Compliance" nowrap>{affected.length > 0 ? `${complete.length} / ${affected.length}` : undefined}</Stat>
                  <Stat dl label="Opened"><DateText value={project.openedDate} /></Stat>
                </dl>
              )}
            </div>
          </section>
        )}

        {/* Always lands on step 2, whatever progress the project already has —
            the reader moves forward one step at a time and uses each step's
            own Back button to retreat, never jumps straight to a later step. */}
        {step === 1 && (
          <div className="flex min-h-0 flex-1 flex-col">
            <FlowStepProject projectId={projectId} onPick={(id) => go(2, { project: id })} query={projectQuery} onQueryChange={setProjectQuery} />
          </div>
        )}
        {step === 2 && project && (
          <div className="flex min-h-0 flex-1 flex-col">
            <FlowStepBasis project={project} onBack={() => go(1)} onNext={() => go(3)} />
          </div>
        )}
        {step === 3 && project && (
          <div className="flex min-h-0 flex-1 flex-col">
            <FlowStepInitialize project={project} onBack={() => go(2)} onNext={() => go(4)} />
          </div>
        )}
        {step === 4 && project && (
          <FlowStepPlan
            rows={planRows}
            index={planIndex}
            onBack={() => go(3)}
            onNext={() => go(5)}
          />
        )}
        {step === 5 && project && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FlowStepReports project={project} />
          </div>
        )}

        {step === 5 && (
          <div className="flex shrink-0 justify-start">
            <Button variant="secondary" leadingIcon={<ArrowLeft size={16} />} onClick={() => go(step - 1)}>Back</Button>
          </div>
        )}
      </div>
      </GcpDataGate>

      {createOpen && (
        <CreateGcpDrawer
          onClose={() => setCreateOpen(false)}
          onCreated={(id, index) => { setPlanIndex(index); go(4, { project: id }); setCreateOpen(false) }}
        />
      )}
    </AppShell>
  )
}
