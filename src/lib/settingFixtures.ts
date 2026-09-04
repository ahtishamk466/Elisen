/* Generated from the client TPMS database export (2026-08-27).
   People are stand-ins; business records are the client's own.
   Regenerate with tools/ (see tools/README.md) — do not hand-edit. */
import type { SettingType, SoftwareSetting } from '@/types/setting'

export const SETTING_TYPE_LABEL: Record<SettingType, string> = {
  string: 'String', integer: 'Integer', boolean: 'Boolean', float: 'Float', null: 'Null',
}

export const SOFTWARE_SETTINGS: SoftwareSetting[] = [
  { id: "set-2", type: "boolean", section: "visibility", key: "active-field", value: "false", description: "Set the visibility of the active field", active: true },
  { id: "set-3", type: "boolean", section: "visibility", key: "index-delete", value: "true", description: "Set the visibility of the index delete button", active: true },
  { id: "set-4", type: "boolean", section: "visibility", key: "view-delete", value: "false", description: "Set the visibility of the view delete button", active: true },
  { id: "set-5", type: "boolean", section: "visibility", key: "modal-tab-id", value: "false", description: "Set the visibility of the modal tab Id field", active: true },
  { id: "set-6", type: "boolean", section: "visibility", key: "dashboard-tab-id", value: "false", description: "Set the visibility of the dashboard tab Id field", active: true },
  { id: "set-7", type: "boolean", section: "visibility", key: "dashboard-tab-update", value: "true", description: "Set the visibility of the dashboard tab update button", active: true },
  { id: "set-8", type: "boolean", section: "visibility", key: "view-id", value: "false", description: "Set the visibility of the view Id field", active: true },
  { id: "set-9", type: "boolean", section: "hoursworked", key: "negative-banked-hours", value: "true", description: "Allow Negative Total Banked Hours", active: true },
  { id: "set-10", type: "boolean", section: "visibility", key: "index-id", value: "false", description: "Set the visibility of the index Id field", active: true },
  { id: "set-11", type: "integer", section: "constant", key: "designdata-drawing-seqnumber", value: "4746", description: "Design Data Drawing Sequential Number", active: true },
]
