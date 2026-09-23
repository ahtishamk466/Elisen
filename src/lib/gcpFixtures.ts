import type { Regulation, RegulationGroup, RegulationGroupSection, Subpart, Subsection } from '@/types/gcp'

/**
 * The regulation rows the client showed from the legacy Regulation list, taken
 * exactly as they read there — section, amendment, title, codes, sort key and
 * section root, including the literal "-" the legacy screen stores where a
 * record has no section root or subsection.
 *
 * The real table holds 3,932 rows; these are the first page of it. The rest
 * arrive with the client's export, the same way every other list in this app
 * is fed (see COMPONENTS.md, "The data is the client's own, fetched not
 * bundled").
 */
export const REGULATIONS: Regulation[] = [
  {
    id: 'reg-1',
    section: '0.0',
    amdt: '25-85',
    title: 'Authority citation.',
    subpartCode: 'A',
    subsectionCode: 'A01',
    url: 'https://www.ecfr.gov/current/title-14/part-25',
    sort: '00.0000_25-85',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '-',
    active: false,
  },
  {
    id: 'reg-2',
    section: '013-2007-NCR/RCN',
    amdt: 'IR',
    title: 'Exemption No. 013-2007-NCR/RCN dated February 15, 2007, Emergency Exit Signs, AWM 525.811(g) and 525.812(b)(1)(i) and (ii)',
    subpartCode: 'EX',
    subsectionCode: '-',
    url: '',
    sort: '013-2007-NCR/RCN_IR',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '-',
    active: false,
  },
  {
    id: 'reg-3',
    section: '23.1',
    amdt: '23-10',
    title: 'Applicability.',
    subpartCode: 'A',
    subsectionCode: 'A01',
    url: 'https://drs.faa.gov/search?searchQuery=23.1',
    sort: '23.0001_23-10',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '23.0001',
    active: false,
  },
  {
    id: 'reg-4',
    section: '23.1',
    amdt: '23-34',
    title: 'Applicability.',
    subpartCode: 'A',
    subsectionCode: 'A01',
    url: 'https://drs.faa.gov/search?searchQuery=23.1',
    sort: '23.0001_23-34',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '23.0001',
    active: true,
  },
  {
    id: 'reg-5',
    section: '23.1',
    amdt: 'IR',
    title: 'Applicability.',
    subpartCode: 'A',
    subsectionCode: 'A01',
    url: 'https://drs.faa.gov/search?searchQuery=23.1',
    sort: '23.0001_IR',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '23.0001',
    active: false,
  },
  {
    id: 'reg-6',
    section: '23.2',
    amdt: '23-32',
    title: '[Special retroactive requirements.]',
    subpartCode: 'A',
    subsectionCode: 'A01',
    url: '',
    sort: '23.0002_23-32',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '23.0002',
    active: false,
  },
  {
    id: 'reg-7',
    section: '23.2',
    amdt: '23-36',
    title: 'Special retroactive requirements.',
    subpartCode: 'A',
    subsectionCode: 'A01',
    url: 'https://drs.faa.gov/search?searchQuery=23.2',
    sort: '23.0002_23-36',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '23.0002',
    active: false,
  },
  {
    id: 'reg-8',
    section: '23.3',
    amdt: '23-34',
    title: 'Airplane categories.',
    subpartCode: 'A',
    subsectionCode: 'A01',
    url: 'https://drs.faa.gov/search?searchQuery=23.3',
    sort: '23.0003_23-34',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '23.0003',
    active: false,
  },
  {
    id: 'reg-9',
    section: '23.3',
    amdt: '23-4',
    title: 'Airplane categories.',
    subpartCode: 'A',
    subsectionCode: 'A01',
    url: '',
    sort: '23.0003_23-4',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '23.0003',
    active: false,
  },
  {
    id: 'reg-10',
    section: '23.21(a)',
    amdt: 'IR',
    title: 'Proof of compliance.',
    subpartCode: 'B',
    subsectionCode: 'B01',
    url: 'https://drs.faa.gov/search?searchQuery=23.21',
    sort: '23.0021(a)_IR',
    requirementText: '',
    defaultMocText: '',
    sectionRoot: '23.0021',
    active: false,
  },
]

/**
 * The subparts the client showed on the legacy Subpart list — pages 1 and 2,
 * 20 of the 21 rows, ids exactly as stored (17 is absent there too). The one
 * row still unseen is on page 3; the create screen's dropdown suggests it is
 * `APP -- APPENDICES`, but its id, sort and active state are not visible in any
 * screenshot, so it is not invented here.
 */
export const SUBPARTS: Subpart[] = [
  { id: '1', code: '-', description: 'TBD / Not Defined', sort: '01', active: true },
  { id: '2', code: 'A', description: 'GENERAL', sort: '02', active: true },
  { id: '3', code: 'AWO', description: 'ALL WEATHER OPERATIONS', sort: '12', active: false },
  { id: '4', code: 'B', description: 'FLIGHT', sort: '03', active: true },
  { id: '5', code: 'C', description: 'STRUCTURE / STRENGTH REQUIREMENTS', sort: '04', active: true },
  { id: '6', code: 'D', description: 'DESIGN AND CONSTRUCTION', sort: '05', active: true },
  { id: '7', code: 'E', description: 'POWERPLANT', sort: '06', active: true },
  { id: '8', code: 'F', description: 'EQUIPMENT', sort: '07', active: true },
  { id: '9', code: 'G', description: 'OPERATING LIMITATIONS AND INFORMATION', sort: '08', active: true },
  { id: '10', code: 'J', description: 'JAA SUBPART J - APU', sort: '11', active: false },
  { id: '11', code: 'K', description: 'AWM 5xx', sort: '13', active: false },
  { id: '12', code: 'L', description: 'AWM 511, 521, FAR 21', sort: '14', active: false },
  { id: '13', code: 'N', description: 'AWM 516, FAR 34/36, ICAO Annex 16', sort: '16', active: false },
  { id: '14', code: 'M', description: 'MILITARY AND NON-CIVIL STANDARDS', sort: '15', active: false },
  { id: '15', code: 'Non-ATC', description: 'Requirements that have been identified as Non-ATCs for this program', sort: '17', active: false },
  { id: '16', code: 'SC', description: 'SPECIAL CONDITIONS', sort: '18', active: false },
  { id: '18', code: 'H', description: 'ELECTRICAL WIRING INTERCONNECTION SYSTEMS (EWIS)', sort: '09', active: true },
  { id: '19', code: 'I', description: 'SPECIAL FEDERAL AVIATION REGULATIONS (SFAR)', sort: '10', active: false },
  { id: '20', code: 'EX', description: 'EXEMPTION', sort: '19', active: false },
  { id: '21', code: 'ES', description: 'EQUIVALENT LEVEL OF SAFETY', sort: '20', active: false },
]

/**
 * The subsections the client showed on the legacy Subsection list — pages 1 and
 * 2, 20 of 74, with each Part's rule range exactly as stored: `X` where that
 * Part has no equivalent, and the legacy typos left alone (B02's `27.45-27-79`,
 * D01's Part 27 reading `29.601-27.629`). None of the twenty is marked active.
 */
export const SUBSECTIONS: Subsection[] = [
  { id: '1', code: 'A01', title: '--', part23: '23.1-23.3', part25: '25.1-25.5', part27: '27.1-27.2', part29: '29.1-29.2', active: false },
  { id: '2', code: 'B01', title: 'General', part23: '23.21-23.33', part25: '25.21-25.33', part27: '27.21-27.33', part29: '29.21-29.33', active: false },
  { id: '3', code: 'B02', title: 'Performance', part23: '23.45-23.77', part25: '25.45-25.125', part27: '27.45-27-79', part29: '29.45-29-87', active: false },
  { id: '4', code: 'B04', title: 'Controllability and Maneuverability', part23: '23.143-23.157', part25: '25.143-25.149', part27: 'X', part29: 'X', active: false },
  { id: '5', code: 'B05', title: 'Trim', part23: '23.161', part25: '25.161', part27: 'X', part29: 'X', active: false },
  { id: '6', code: 'B06', title: 'Stability', part23: '23.171-23.181', part25: '25.171-25.181', part27: 'X', part29: 'X', active: false },
  { id: '7', code: 'B07', title: 'Stalls', part23: '23.201-23.207', part25: '25.201-25.207', part27: 'X', part29: 'X', active: false },
  { id: '8', code: 'B09', title: 'Ground and Water Handling Characteristics', part23: '23.231-23.239', part25: '25.231-25.239', part27: '27.231-27.241', part29: '29.231-29.241', active: false },
  { id: '9', code: 'B10', title: 'Miscellaneous Flight Requirements', part23: '23.251-23.255', part25: '25.251-25.255', part27: '27.251', part29: '29.251', active: false },
  { id: '10', code: 'C01', title: 'General', part23: '23.301-23.307', part25: '25.301-25.307', part27: '27.301-27.309', part29: '29.301-29.309', active: false },
  { id: '11', code: 'C02', title: 'Flight Loads', part23: '23.321-23.373', part25: '25.321', part27: '27.321-27.361', part29: '29.321-29.361', active: false },
  { id: '12', code: 'C03', title: 'Flight Maneuver and Gust Conditions', part23: 'X', part25: '25.331-25.351', part27: 'X', part29: 'X', active: false },
  { id: '13', code: 'C04', title: 'Supplementary Conditions', part23: 'X', part25: '25.361-25.373', part27: 'X', part29: 'X', active: false },
  { id: '14', code: 'C05', title: 'Control Surface and System Loads', part23: '23.391-23.415', part25: '25.391-25.459', part27: '27.391-27.427', part29: '29.391-29.427', active: false },
  { id: '15', code: 'C09', title: 'Ground Loads', part23: '23.471-23.511', part25: '25.471-25.519', part27: '27.471-27.505', part29: '29.471-29.511', active: false },
  { id: '16', code: 'C12', title: 'Emergency Landing Conditions', part23: '23.561-23.562', part25: '25.561-25.563', part27: '27.561-27.563', part29: '29.561-29.563', active: false },
  { id: '17', code: 'C13', title: 'Fatigue Evaluation', part23: '23.571-23.575', part25: '25.571-25.573', part27: '27.571-27.573', part29: '29.571-29.573', active: false },
  { id: '18', code: 'C14', title: 'Lightning Protection', part23: 'X', part25: '25.581', part27: 'X', part29: 'X', active: false },
  { id: '19', code: 'D01', title: 'General', part23: '23.601-23.629', part25: '25.601-25.631', part27: '29.601-27.629', part29: '29.601-29.631', active: false },
  { id: '20', code: 'D03', title: 'Control Surfaces', part23: '23.651-23.659', part25: '25.651-25.657', part27: 'X', part29: 'X', active: false },
]

/** The three groups on the client's Regulation Group list, all active. */
export const REGULATION_GROUPS: RegulationGroup[] = [
  { id: 'rg-1', title: 'Galley Modification', description: 'Addition or modification of a galley', active: true },
  { id: 'rg-2', title: 'IFE (AV/EL) Mod', description: 'In-flight-entertainment modification (non-essential, non-required systems only)', active: true },
  { id: 'rg-3', title: 'Cabin (Interior) Bulkheads', description: 'Cabin (Interior) Bulkheads', active: true },
]

/** Empty on purpose: the client's Regulation Group Section list reads "No
    results found" — the groups exist, the rules under them were never filled
    in. */
export const REGULATION_GROUP_SECTIONS: RegulationGroupSection[] = []
