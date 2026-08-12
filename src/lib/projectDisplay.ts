import type { BadgeTone } from '@/components/ui/Badge'
import type { ProjectPriority, ProjectStatus, ProjectType } from '@/types/project'

export const PRIORITY_LABEL: Record<ProjectPriority, string> = {
  '1-fire': '1 - Fire', '2-high': '2 - High', '3-med': '3 - Med', '4-low': '4 - Low', '5-lowest': '5 - Lowest',
}

/** Project Detail sidebar shows priority as a pill (unlike the list table's
    plain-text priority column — see docs/DECISIONS.md). */
export const PRIORITY_TONE: Record<ProjectPriority, BadgeTone> = {
  '1-fire': 'danger', '2-high': 'warning', '3-med': 'info', '4-low': 'neutral', '5-lowest': 'neutral',
}

export const STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  query: 'neutral', quoted: 'info', tentative: 'info', active: 'warning',
  'on-hold': 'neutral', complete: 'success', cancelled: 'danger',
}
export const STATUS_LABEL: Record<ProjectStatus, string> = {
  query: 'Query', quoted: 'Quoted', tentative: 'Tentative', active: 'In Progress',
  'on-hold': 'On Hold', complete: 'Complete', cancelled: 'Cancelled',
}

export const TYPE_LABEL: Record<ProjectType, string> = {
  internal: 'Internal', preferred: 'Preferred', 'preferred-duncan': 'Duncan',
  'preferred-topaces': 'Top Aces', external: 'External', other: 'Other',
}
