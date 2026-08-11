/**
 * Lookup Tables — the old system's six flat grids are three parent→child
 * pairs, merged under their parents here (see docs/DECISIONS.md):
 * Company→Contacts, Aircraft→Serials, ATA Chapter→Sub Chapters.
 * `active` is the lifecycle: inactive records keep history but are hidden
 * from pickers elsewhere in the app.
 */
export interface Company {
  id: string
  name: string
  address1: string
  address2: string
  city: string
  provState: string
  country: string
  postal: string
  phone: string
  active: boolean
}

export interface CompanyContact {
  id: string
  companyId: string
  /** One field, not first/last — the rest of the app already treats a
      contact as a single display name (ProjectListRow.contactName). */
  fullName: string
  phone: string
  active: boolean
}

export interface AircraftModel {
  id: string
  modelNumber: string
  modelName: string
  manufacturer: string
  tccaTc: string
  faaTc: string
  easaTc: string
  /** Drives drawing numbering, e.g. AB → DRW-AB-… */
  drawingPrefix: string
  active: boolean
}

export interface AircraftSerial {
  id: string
  aircraftId: string
  serial: string
  registration: string
  comment: string
  active: boolean
}

export interface AtaChapter {
  id: string
  /** Two-digit chapter code, e.g. '05'. */
  chapter: string
  title: string
  definition: string
  sort: number
  active: boolean
}

export interface AtaSubChapter {
  id: string
  chapterId: string
  /** Two-digit section code within the chapter, e.g. '10'; '00' = General. */
  section: string
  title: string
  definition: string
  sort: number
  active: boolean
}
