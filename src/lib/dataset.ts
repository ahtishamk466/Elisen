import type { ProjectListRow } from '@/types/project'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'
import type { Company, CompanyContact, AircraftModel, AircraftSerial, AtaChapter, AtaSubChapter } from '@/types/lookup'
import type { Approval, ApprovalRevision, DocRevision, ProjectDocument, ProjectRevisionLink } from '@/types/documents'
import type { TccaDocLink, TccaProject } from '@/types/tcca'
import type { TimesheetEntry } from '@/types/timesheet'

/**
 * The client's own records, served as JSON rather than compiled in.
 *
 * There is no backend, so the data has to reach the browser somehow. Bundling
 * it would put ~14 MB through the JS parser on every load and grow the bundle
 * fourteen-fold; as static JSON it gzips to well under half the bundle's size,
 * is cached by the browser like any other asset, and can be regenerated
 * (`tools/`, see `tools/README.md`) without a rebuild.
 *
 * Split in two on purpose:
 * - **Core** blocks the first render. Nearly every screen needs some of it,
 *   and it is ~450 KB over the wire.
 * - **Timesheet** is 31k rows and only four screens read it, so it loads on
 *   its own and those screens show their existing loading state until it lands.
 */
export interface CoreData {
  projects: ProjectListRow[]
  workPackages: WorkPackage[]
  wpActivities: WorkPackageActivity[]
  companies: Company[]
  contacts: CompanyContact[]
  aircraft: AircraftModel[]
  serials: AircraftSerial[]
  ataChapters: AtaChapter[]
  ataSubChapters: AtaSubChapter[]
  documents: ProjectDocument[]
  docRevisions: DocRevision[]
  projectRevisionLinks: ProjectRevisionLink[]
  approvals: Approval[]
  approvalRevisions: ApprovalRevision[]
  tccaProjects: TccaProject[]
  tccaDocLinks: TccaDocLink[]
}

const CORE_KEYS = [
  'projects', 'workPackages', 'wpActivities', 'companies', 'contacts', 'aircraft', 'serials',
  'ataChapters', 'ataSubChapters', 'documents', 'docRevisions', 'projectRevisionLinks',
  'approvals', 'approvalRevisions', 'tccaProjects', 'tccaDocLinks',
] as const

/** Empty until `loadCore()` resolves. Stores read it in their initialisers,
    which only run after the loader has finished — see `main.tsx`. */
let core: CoreData = Object.fromEntries(CORE_KEYS.map((k) => [k, []])) as unknown as CoreData

async function fetchJson<T>(name: string): Promise<T> {
  /* BASE_URL, not a bare '/', so the app still finds its data when served
     from a sub-path. */
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`Could not load ${name}.json (${res.status})`)
  return res.json() as Promise<T>
}

/** Fetches every core file in parallel. Call once, before rendering. */
export async function loadCore(): Promise<CoreData> {
  const parts = await Promise.all(CORE_KEYS.map((k) => fetchJson<unknown[]>(k)))
  core = Object.fromEntries(CORE_KEYS.map((k, i) => [k, parts[i]])) as unknown as CoreData
  return core
}

export const coreData = (): CoreData => core

let timesheetPromise: Promise<TimesheetEntry[]> | null = null

/** Loaded once and shared — several screens ask for it independently. */
export function loadTimesheet(): Promise<TimesheetEntry[]> {
  timesheetPromise ??= fetchJson<TimesheetEntry[]>('timesheet')
  return timesheetPromise
}
