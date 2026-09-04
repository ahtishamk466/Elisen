import type { BadgeTone } from '@/components/ui/Badge'
import type { WorkPackageStatus } from '@/types/workPackage'

/** One source for how a work package's status reads, so the Projects tab and
    the Work Packages workspace can never label the same status differently. */
export const WP_STATUS_LABEL: Record<WorkPackageStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  complete: 'Complete',
}

export const WP_STATUS_TONE: Record<WorkPackageStatus, BadgeTone> = {
  'not-started': 'neutral',
  'in-progress': 'warning',
  complete: 'success',
}

/** Two-digit rail number, so a list of packages reads like the ATA chapters. */
export const wpIndex = (i: number) => String(i + 1).padStart(2, '0')
