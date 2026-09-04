import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAccessStore } from '@/stores/accessStore'

export type PageState = 'ready' | 'loading' | 'error'

/** The engine room — old "Routes" registry + "Rules", deliberately demoted
    to an advanced page since admins rarely touch either. */
export function SystemAccessPage({ state = 'ready' }: { state?: PageState }) {
  const routes = useAccessStore((s) => s.routeRegistry)
  const permissions = useAccessStore((s) => s.permissions)
  const rules = useAccessStore((s) => s.rules)
  const addRoute = useAccessStore((s) => s.addRoute)

  const [query, setQuery] = useState('')
  const [newRoute, setNewRoute] = useState('')
  const [routeError, setRouteError] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(
    () => routes.filter((r) => r.includes(query.toLowerCase().trim())),
    [routes, query],
  )
  const guardsFor = (route: string) => permissions.filter((p) => p.routes.includes(route))

  const handleAdd = () => {
    const path = newRoute.trim()
    if (!/^\/[a-z0-9\-/]*(\*)?$/.test(path)) { setRouteError('Routes start with / and use lowercase segments, e.g. /report/index or /report/*.'); return }
    if (routes.includes(path)) { setRouteError('That route is already registered.'); return }
    addRoute(path)
    setNewRoute('')
    setToast(`Route ${path} registered, attach it to a permission to guard it.`)
  }

  if (state === 'error') {
    return (
      <AppShell title="Routes & Rules" activeItem="User Access" activeChild="Routes">
        <Alert title="We couldn't load routes and rules">Refresh the page, and if it keeps happening, contact your administrator.</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell title="Routes & Rules" activeItem="User Access" activeChild="Routes">
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}
        <Alert tone="info" title="Advanced, the wiring behind roles and permissions">
          Day-to-day access management lives in Users and Roles &amp; Permissions. This page registers the raw
          routes the app exposes and lists the code-defined rules, usually developer territory.
        </Alert>

        {state === 'loading' ? (
          <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : (
          <>
            <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
              <h2 className="text-lg font-bold text-text-primary">Routes</h2>
              <p className="mt-xxss text-xs text-text-muted">
                Every URL the app exposes. A route does nothing until a permission guards it; entries ending in /* cover all child routes.
              </p>
              <div className="mt-lg grid gap-sm tablet:flex tablet:items-start">
                <div className="min-w-0 tablet:flex-1">
                  <label htmlFor="new-route" className="sr-only">New route</label>
                  <Input id="new-route" size="sm" value={newRoute} error={!!routeError} placeholder="/module/action or /module/*"
                    onChange={(e) => { setNewRoute(e.target.value); setRouteError('') }} />
                  {routeError && <p className="mt-xs text-xs text-danger">{routeError}</p>}
                </div>
                <Button leadingIcon={<Plus size={16} />} onClick={handleAdd}>Register Route</Button>
              </div>
              <div className="mt-lg" style={{ maxWidth: 380 }}>
                <label htmlFor="route-search" className="sr-only">Search routes</label>
                <Input id="route-search" size="sm" value={query} placeholder="Search routes..." leadingIcon={<Search size={16} />}
                  onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="mt-lg grid gap-sm">
                {filtered.length === 0 && <p className="text-sm text-text-muted">No routes match your search.</p>}
                {filtered.map((r) => {
                  const guards = guardsFor(r)
                  return (
                    <div key={r} className="flex items-center justify-between gap-lg border-b border-border-default pb-sm last:border-b-0 last:pb-0">
                      <span className="text-sm text-text-primary">{r}</span>
                      {guards.length === 0
                        ? <Badge tone="warning">Unassigned</Badge>
                        : <Badge appearance="outline">{guards.length} permission{guards.length === 1 ? '' : 's'}</Badge>}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
              <h2 className="text-lg font-bold text-text-primary">Rules</h2>
              <p className="mt-xxss text-xs text-text-muted">
                Code-defined condition classes referenced by permissions (e.g. "own entries only"). Developers add these in code. They can't be created here.
              </p>
              <div className="mt-lg grid gap-sm">
                {rules.length === 0 && <p className="text-sm text-text-muted">No rules defined.</p>}
                {rules.map((rule) => {
                  const usedBy = permissions.filter((p) => p.ruleId === rule.id)
                  return (
                    <div key={rule.id} className="flex items-center justify-between gap-lg border-b border-border-default pb-sm last:border-b-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary">{rule.name}</p>
                        <p className="text-xs text-text-muted">{rule.className}</p>
                      </div>
                      <Badge appearance="outline">
                        {usedBy.length === 0 ? 'Unused' : `Used by ${usedBy.map((p) => p.id).join(', ')}`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
