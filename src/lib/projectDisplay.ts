import type { BadgeTone } from '@/components/ui/Badge'
import type { ProjectPriority, ProjectStatus, ProjectType } from '@/types/project'

export const PRIORITY_LABEL: Record<ProjectPriority, string> = {
  '1-fire': '1 - Fire', '2-high': '2 - High', '3-med': '3 - Med', '4-low': '4 - Low',
}

export const STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  quoted: 'info', active: 'warning', 'on-hold': 'neutral', complete: 'success', cancelled: 'danger',
}
export const STATUS_LABEL: Record<ProjectStatus, string> = {
  quoted: 'Quoted', active: 'In Progress', 'on-hold': 'On Hold', complete: 'Complete', cancelled: 'Cancelled',
}

export const TYPE_LABEL: Record<ProjectType, string> = {
  internal: 'Internal', 'preferred-duncan': 'Duncan', 'preferred-topaces': 'Top Aces', external: 'External',
}
