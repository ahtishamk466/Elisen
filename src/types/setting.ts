/**
 * Software Settings — the client's key/value configuration table. A setting
 * is identified by section + key; `type` says how `value` should be read.
 */
export type SettingType = 'string' | 'integer' | 'boolean' | 'float' | 'null'

export interface SoftwareSetting {
  id: string
  type: SettingType
  /** Groups related keys, e.g. 'visibility', 'hoursworked', 'constant'. */
  section: string
  key: string
  /** Always stored as text; `type` says how to interpret it. */
  value: string
  description: string
  active: boolean
}
