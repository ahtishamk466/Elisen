/** A read-only identity field — same label/value shape as `Stat`, but at
    `font-medium` rather than `Stat`'s semibold: these are reference values
    read off the rule or project, not the emphasized figures `Stat`'s spec
    is fixed for. Shared between `GcpFlowPage`'s persistent summary card and
    `FlowStepPlan`, since step 4 replaces that card's usual stat band with
    exactly these fields. */
export function ReadOnlyField({ label, children }: { label: string; children?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-normal text-text-muted">{label}</p>
      <p className="mt-xxss text-sm font-medium text-text-primary">{children || '—'}</p>
    </div>
  )
}
