import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

/** Obviously-fake demo data mirroring the client's own example: a
    "Certification Plan" package where Airworthiness creates the document
    and a Delegate checks it at fewer, pricier hours. */
export const WORK_PACKAGES: WorkPackage[] = [
  {
    id: 'wp-1', projectId: '1', title: 'Certification Plan',
    description: 'Plan of how compliance will be shown for the cabin interior modification.',
    status: 'in-progress',
  },
  {
    id: 'wp-2', projectId: '1', title: 'Seat Installation',
    description: 'Forward club seat installation — drawings, substantiation and manuals.',
    status: 'in-progress',
  },
  {
    id: 'wp-3', projectId: '1', title: 'Weight & Balance Report',
    description: '',
    status: 'not-started',
  },
  {
    id: 'wp-4', projectId: '2', title: 'Console Map Lights',
    description: 'Add map lights to the approved workstation console.',
    status: 'complete',
  },
]

export const WP_ACTIVITIES: WorkPackageActivity[] = [
  { id: 'wpa-1', workPackageId: 'wp-1', activityId: 'airworthiness', responsible: 'Kelly Osei', budgetHours: 12, actualHours: 8 },
  { id: 'wpa-2', workPackageId: 'wp-1', activityId: 'delegate', responsible: 'Harris Bell', budgetHours: 3, actualHours: 1 },
  { id: 'wpa-3', workPackageId: 'wp-2', activityId: 'mech-design', responsible: 'Sofia Reyes', budgetHours: 40, actualHours: 22 },
  { id: 'wpa-4', workPackageId: 'wp-2', activityId: 'struct-validation', responsible: 'Lloyd Pedvis', budgetHours: 24, actualHours: 30 },
  { id: 'wpa-5', workPackageId: 'wp-2', activityId: 'manuals', responsible: 'Kelly Osei', budgetHours: 8, actualHours: 0 },
  { id: 'wpa-6', workPackageId: 'wp-4', activityId: 'elec-design', responsible: 'Remi Rocheleau', budgetHours: 16, actualHours: 15 },
]
