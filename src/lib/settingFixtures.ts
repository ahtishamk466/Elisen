import type { SettingType, SoftwareSetting } from '@/types/setting'

/** The filter dropdown's options, in the order the old screen listed them. */
export const SETTING_TYPE_LABEL: Record<SettingType, string> = {
  string: 'String',
  integer: 'Integer',
  boolean: 'Boolean',
  float: 'Float',
  null: 'Null',
}

/** Verbatim from the client's Settings screen — all 10 rows, in order. */
export const SOFTWARE_SETTINGS: SoftwareSetting[] = [
  { id: 'st-1', type: 'boolean', section: 'visibility', key: 'active-field', value: 'true', description: 'Set the visibility of the active field', active: true },
  { id: 'st-2', type: 'boolean', section: 'visibility', key: 'index-delete', value: 'true', description: 'Set the visibility of the index delete button', active: true },
  { id: 'st-3', type: 'boolean', section: 'visibility', key: 'view-delete', value: 'false', description: 'Set the visibility of the view delete button', active: true },
  { id: 'st-4', type: 'boolean', section: 'visibility', key: 'modal-tab-id', value: 'true', description: 'Set the visibility of the modal tab Id field', active: true },
  { id: 'st-5', type: 'boolean', section: 'visibility', key: 'dashboard-tab-id', value: 'true', description: 'Set the visibility of the dashboard tab Id field', active: true },
  { id: 'st-6', type: 'boolean', section: 'visibility', key: 'dashboard-tab-update', value: 'true', description: 'Set the visibility of the dashboard tab update button', active: true },
  { id: 'st-7', type: 'boolean', section: 'visibility', key: 'view-id', value: 'true', description: 'Set the visibility of the view Id field', active: true },
  { id: 'st-8', type: 'boolean', section: 'hoursworked', key: 'negative-banked-hours', value: 'true', description: 'Allow Negative Total Banked Hours', active: true },
  { id: 'st-9', type: 'boolean', section: 'visibility', key: 'index-id', value: 'false', description: 'Set the visibility of the index Id field', active: true },
  { id: 'st-10', type: 'integer', section: 'constant', key: 'designdata-drawing-seqnumber', value: '4610', description: 'Design Data Drawing Sequential Number', active: true },
]
