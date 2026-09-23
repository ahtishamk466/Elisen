import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/patterns/AppShell'
import { Stepper } from '@/components/patterns/Stepper'
import { Button } from '@/components/ui/Button'
import { useTccaStore } from '@/stores/tccaStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { FlowStepProject } from './FlowStepProject'
import { FlowStepBasis } from './FlowStepBasis'
import { FlowStepInitialize } from './FlowStepInitialize'
import { FlowStepPlan } from './FlowStepPlan'
import { FlowStepDashboard } from './FlowStepDashboard'

export const FLOW_STEPS = [
  'Project',
  'Certification Basis',
  'Initialize',
  'Certification Plan',
  'Dashboard',
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
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const planEntries = useGcpFlowStore((s) => s.planEntries)

  const projectId = searchParams.get('project') ?? ''
  const project = tccaProjects.find((t) => t.id === projectId) ?? null
  const basisId = project ? projectBasis[project.id] : undefined
  const projectEntries = planEntries.filter((e) => e.projectId === projectId)
  const affected = projectEntries.filter((e) => e.affected)

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

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Certification Flow"
      title="Certification Flow"
      description={project ? `${project.number} · ${project.description}` : 'One certification project, start to finish.'}
    >
      <div className="grid gap-lg">
        <div className="rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
          <Stepper steps={[...FLOW_STEPS]} current={step - 1} />
        </div>

        {step === 1 && <FlowStepProject projectId={projectId} onPick={(id, atStep) => go(atStep ?? 2, { project: id })} />}
        {step === 2 && project && <FlowStepBasis project={project} onNext={() => go(3)} />}
        {step === 3 && project && <FlowStepInitialize project={project} onNext={() => go(4)} />}
        {step === 4 && project && <FlowStepPlan project={project} onNext={() => go(5)} />}
        {step === 5 && project && <FlowStepDashboard project={project} />}

        {step > 1 && (
          <div className="flex justify-start">
            <Button variant="secondary" onClick={() => go(step - 1)}>Back</Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
