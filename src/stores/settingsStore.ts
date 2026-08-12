import { create } from 'zustand'
import { SOFTWARE_SETTINGS } from '@/lib/settingFixtures'
import type { SoftwareSetting } from '@/types/setting'

interface SettingsState {
  settings: SoftwareSetting[]
  saveSetting: (setting: SoftwareSetting) => void
  updateSetting: (id: string, patch: Partial<SoftwareSetting>) => void
  removeSetting: (id: string) => void
}

/** Existing rows keep their position; new ones append, so the "#" column
    stays stable while a setting is being edited. */
const upsert = (list: SoftwareSetting[], item: SoftwareSetting) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: SOFTWARE_SETTINGS,
  saveSetting: (setting) => set((s) => ({ settings: upsert(s.settings, setting) })),
  updateSetting: (id, patch) =>
    set((s) => ({ settings: s.settings.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  removeSetting: (id) => set((s) => ({ settings: s.settings.filter((x) => x.id !== id) })),
}))
