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
  /** One free-text field — street, unit, and state/province all together,
      not three separate inputs the user has to decide how to split. */
  address: string
  city: string
  country: string
  postal: string
  active: boolean
}

export interface CompanyContact {
  id: string
  companyId: string
  /** One field, not first/last — the rest of the app already treats a
      contact as a single display name (ProjectListRow.contactName). */
  fullName: string
  phoneCountryCode: string
  phoneNumber: string
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

/**
 * One specific airframe, plus the owner/operator it belongs to.
 *
 * This is not just a tail number hung off a model: eleven of the legacy
 * `serialnumber` table's fields are owner and contact details, which is why it
 * is a record in its own right rather than a column on the model. The model
 * carries type certificates and the drawing prefix; the airframe carries who
 * owns it and how to reach them.
 */
export interface AircraftSerial {
  id: string
  /** The AircraftModel this airframe is one of. Required: a serial is only
      unique within its model, so it is meaningless on its own. */
  aircraftId: string
  serial: string
  /** Tail number. Changes over an airframe's life while the serial does not. */
  registration: string

  // Owner / operator, from the legacy serialnumber table.
  ownerName: string
  company: string
  addressLine1: string
  addressLine2: string
  city: string
  provState: string
  country: string
  postalZipcode: string
  telephone: string
  email: string

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
