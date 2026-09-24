/**
 * One rule at one amendment — the pool every certification basis draws from.
 * Fields mirror the legacy `regulation` table and its create screen.
 */
export interface Regulation {
  id: string
  /** `Section` — the rule number as the FAA writes it, e.g. 23.21(a). */
  section: string
  /** `Amdt` — the amendment this record carries, e.g. 23-34. `IR` is the
      initial revision, the rule as first issued. */
  amdt: string
  title: string
  /** `Subpart Code` — the code of the subpart this rule sits under. */
  subpartCode: string
  /** `Subsection Code` — the code of the subsection within that subpart. */
  subsectionCode: string
  /** `Url` — where the rule text can be read. Empty when none is stored. */
  url: string
  /** `Sort` — the stored ordering key, section root and amendment joined. */
  sort: string
  /** `Requirement Text` — the rule's own wording, as it prints in the
      certification plan. */
  requirementText: string
  /** `Default Moc Text` — the method statement offered as the starting point
      when this rule is planned on a project. */
  defaultMocText: string
  /** `Section Root` — the rule number without its amendment, which is what
      delegation is granted against. */
  sectionRoot: string
  active: boolean
}

/** A subpart of the rules — the FAA's own top-level grouping. */
export interface Subpart {
  id: string
  code: string
  description: string
  /** `Sort` — stored as a two-digit string, e.g. 01. */
  sort: string
  active: boolean
}

/** A subsection within a subpart, with the rule range it covers in each Part.
    `X` means the Part has no equivalent. */
export interface Subsection {
  id: string
  code: string
  title: string
  part23: string
  part25: string
  part27: string
  part29: string
  active: boolean
}

/** A named kind of modification — a galley change, an IFE fit — that carries
    the rules such a change usually affects. */
export interface RegulationGroup {
  id: string
  title: string
  description: string
  active: boolean
}

/** One rule, by section root, attached to a regulation group. */
export interface RegulationGroupSection {
  id: string
  groupId: string
  /** `Regulation Section Root` — the rule number without its amendment. */
  sectionRoot: string
  active: boolean
}

/**
 * One aircraft's rule set. Merges the legacy `Master Cert Basis` (the identity —
 * aircraft model and type certificate) with `Cert Basis` (the regulations
 * allocated to it), which the client asked to see as a single screen.
 */
export interface CertBasis {
  id: string
  /** The aircraft model the basis is for, e.g. CL-650. */
  aircraftModel: string
  /** The Transport Canada type certificate the rules were read from. Empty for
      a project-specific basis, which has no TCDS. */
  tcdsNumber: string
  /** Regulation ids from the rule pool — each already carries its own
      amendment, title, subpart and subsection codes. */
  regulationIds: string[]
}

/** One affected rule on one project, with everything planned for it. */
export interface PlanEntry {
  id: string
  projectId: string
  regulationId: string
  /** Set on Initialize: whether the modification touches this rule. */
  affected: boolean
  /** What will be done — seeded from the regulation's Default Moc Text. */
  methodText: string
  comments: string
  /** Part 23 new-rule projects only. */
  ddsType: string
  ddsText: string
  /** Set on the Dashboard: this rule's plan is finished. Drives GCP Progress
      on the project picker. */
  complete: boolean
}

/** One discipline's plan for one rule: who shows compliance, how, and where.
    Fields and names mirror the legacy `gcp` table and its create screen. */
export interface GcpItem {
  id: string
  planEntryId: string
  /** `Dao Specialty Code` — matches the Discipline reference list. */
  daoSpecialtyCode: string
  /** `Moc Code` — matches the MOC reference list. */
  mocCode: string
  /** `Foc Code` — matches the FOC reference list, filtered by Delegation
      against this rule's Section Root. */
  focCode: string
  /** `Deliverable Number`. */
  deliverableId: string
  active: boolean
}

/** Who can find or recommend compliance, and under which code — delegates,
    candidates, certification engineers, outside specialists and Transport
    Canada. Fields mirror the legacy `foc` table and its create screen.
    `authoritySpecialist` is a name only in the sense every legacy row has
    one; every real person's name is replaced with a placeholder here (see
    docs/DECISIONS.md — the legacy portal is unauthenticated and effectively
    public, so no real name is ever bundled into this app). */
export interface Foc {
  id: string
  code: string
  authoritySpecialist: string
  specialty: string
  /** `Default` — the FOC offered first when a rule's own default isn't set. */
  isDefault: boolean
}

/** One technical discipline, at the DAO specialty code level, mapped to its
    Elisen and TCCA names — the third People & Authority list, matching the
    legacy `discipline` table and its create screen. */
export interface Discipline {
  id: string
  daoSpecialtyCode: string
  elisenDiscipline: string
  tccaDiscipline: string
  active: boolean
}

/** Which rule numbers a FOC code may sign for — the second People &
    Authority list, matching the legacy `delegation` table and its create
    screen. `sectionRoot` here is the padded root a `Regulation`'s own
    `sectionRoot` uses (e.g. `23.0021`), not the bare `23.21` a reader would
    type. */
export interface Delegation {
  id: string
  sectionRoot: string
  focCode: string
  limitation: boolean
  active: boolean
}

/** One Means of Compliance code — how a rule's compliance is shown (design
    review, inspection, test, and the rest). Reference Lists' MOC tab,
    matching the legacy `moc` table and its create screen field-for-field
    (Code, Title, Description — the legacy list carries no Active flag). */
export interface Moc {
  id: string
  code: string
  title: string
  description: string
}

/** One DDS (Detailed Design Specification) type — the specification kinds
    used on Part 23 projects under the new rule format, offered from the
    `DDS Id` field in the Compliance Plan step. Reference Lists' DDS tab.
    The legacy `dds/index` list has only Type + Active; `ddsText` is new
    here, carrying the rich HTML template a DDS entry of this type starts
    from (same `RichTextEditor` used by `FlowStepPlan`'s own DDS Text
    field), per the client's own instruction — no Active flag, matching
    the request as given rather than the legacy screen's own column set. */
export interface DdsType {
  id: string
  type: string
  ddsText: string
}
