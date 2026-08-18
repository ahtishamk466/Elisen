import type { BadgeTone } from '@/components/ui/Badge'
import type { TccaDocState, TccaInvolvement, TccaStatus, TccaProjectStatus, TccaProjectLevel } from '@/types/tcca'

export const TCCA_STATUS_LABEL: Record<TccaStatus, string> = {
  'in-progress': 'In Progress',
  approved: 'Approved',
  closed: 'Closed',
}
export const TCCA_STATUS_TONE: Record<TccaStatus, BadgeTone> = {
  'in-progress': 'warning',
  approved: 'success',
  closed: 'neutral',
}

export const INVOLVEMENT_LABEL: Record<TccaInvolvement, string> = {
  none: 'No involvement',
  review: 'TCCA reviews',
  approve: 'TCCA approves',
}

export const DOC_STATE_LABEL: Record<TccaDocState, string> = {
  'not-sent': 'Not sent',
  sent: 'Sent',
  accepted: 'Accepted',
  comments: 'Comments received',
}
export const DOC_STATE_TONE: Record<TccaDocState, BadgeTone> = {
  'not-sent': 'neutral',
  sent: 'info',
  accepted: 'success',
  comments: 'warning',
}

export const TCCA_PROJECT_STATUS_LABEL: Record<TccaProjectStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  complete: 'Complete',
  cancelled: 'Cancelled',
}

export const TCCA_PROJECT_LEVEL_LABEL: Record<TccaProjectLevel, string> = {
  major: 'Major',
  minor: 'Minor',
  'not-assigned': 'Not Assigned',
}
