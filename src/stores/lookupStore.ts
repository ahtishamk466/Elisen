import { create } from 'zustand'
import {
  AIRCRAFT_MODELS, AIRCRAFT_SERIALS, ATA_CHAPTERS, ATA_SUB_CHAPTERS, COMPANIES_LOOKUP, COMPANY_CONTACTS,
} from '@/lib/lookupFixtures'
import type { AircraftModel, AircraftSerial, AtaChapter, AtaSubChapter, Company, CompanyContact } from '@/types/lookup'

interface LookupState {
  companies: Company[]
  contacts: CompanyContact[]
  aircraft: AircraftModel[]
  serials: AircraftSerial[]
  chapters: AtaChapter[]
  subChapters: AtaSubChapter[]

  /** Upsert a company and replace its contact list in one save (the drawer
      edits both together). */
  saveCompany: (company: Company, contacts: CompanyContact[]) => void
  updateCompany: (id: string, patch: Partial<Company>) => void
  /** Also removes the company's contacts. */
  removeCompany: (id: string) => void

  saveAircraft: (model: AircraftModel, serials: AircraftSerial[]) => void
  updateAircraft: (id: string, patch: Partial<AircraftModel>) => void
  /** Also removes the model's serials. */
  removeAircraft: (id: string) => void

  addChapter: (c: AtaChapter) => void
  updateChapter: (id: string, patch: Partial<AtaChapter>) => void
  /** Also removes the chapter's sections. */
  removeChapter: (id: string) => void
  addSubChapter: (s: AtaSubChapter) => void
  updateSubChapter: (id: string, patch: Partial<AtaSubChapter>) => void
  removeSubChapter: (id: string) => void
}

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

export const useLookupStore = create<LookupState>((set) => ({
  companies: COMPANIES_LOOKUP,
  contacts: COMPANY_CONTACTS,
  aircraft: AIRCRAFT_MODELS,
  serials: AIRCRAFT_SERIALS,
  chapters: ATA_CHAPTERS,
  subChapters: ATA_SUB_CHAPTERS,

  saveCompany: (company, contacts) =>
    set((s) => ({
      companies: upsert(s.companies, company),
      contacts: [...s.contacts.filter((c) => c.companyId !== company.id), ...contacts],
    })),
  updateCompany: (id, patch) =>
    set((s) => ({ companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  removeCompany: (id) =>
    set((s) => ({
      companies: s.companies.filter((c) => c.id !== id),
      contacts: s.contacts.filter((c) => c.companyId !== id),
    })),

  saveAircraft: (model, serials) =>
    set((s) => ({
      aircraft: upsert(s.aircraft, model),
      serials: [...s.serials.filter((x) => x.aircraftId !== model.id), ...serials],
    })),
  updateAircraft: (id, patch) =>
    set((s) => ({ aircraft: s.aircraft.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  removeAircraft: (id) =>
    set((s) => ({
      aircraft: s.aircraft.filter((a) => a.id !== id),
      serials: s.serials.filter((x) => x.aircraftId !== id),
    })),

  addChapter: (c) => set((s) => ({ chapters: [...s.chapters, c] })),
  updateChapter: (id, patch) =>
    set((s) => ({ chapters: s.chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  removeChapter: (id) =>
    set((s) => ({
      chapters: s.chapters.filter((c) => c.id !== id),
      subChapters: s.subChapters.filter((x) => x.chapterId !== id),
    })),
  addSubChapter: (sub) => set((s) => ({ subChapters: [...s.subChapters, sub] })),
  updateSubChapter: (id, patch) =>
    set((s) => ({ subChapters: s.subChapters.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  removeSubChapter: (id) => set((s) => ({ subChapters: s.subChapters.filter((x) => x.id !== id) })),
}))
