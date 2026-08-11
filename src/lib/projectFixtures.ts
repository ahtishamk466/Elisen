import type { ProjectListRow } from '@/types/project'

/** Obviously-fake demo data for stories and the prototype shell. */
export const PROJECT_ROWS: ProjectListRow[] = [
  {
    id: '1', number: '3200', subNumber: '00', type: 'internal',
    title: 'STC — Cabin Interior Modification, Cert Program',
    companyName: 'Northwind Aerospace', companyNumber: '246',
    contactName: 'Nathalie Gagnon', contactEmail: 'nathalie.gagnon@northwindaerospace.example',
    personResponsible: 'Sofia Reyes',
    actualHours: 44, budgetHours: 80, priority: '1-fire', status: 'quoted',
    openedDate: '2026-01-01', dueDate: '2026-07-04', aircraftInputDate: '2026-04-16', closedDate: '',
    scope: ['design', 'validation', 'certification', 'parts-kit'],
    contractCurrency: 'USD', contractValue: '485000',
    proposalSubmitted: 'no', proposalSubmittedDate: '2026-07-04', proposalAccepted: 'no', proposalAcceptedDate: '',
    nextAction: 'Follow up with client on outstanding documentation.',
    comments: 'Certification project covering design substantiation, compliance documentation and TCCA approval.',
    aircraft: [{ id: 'ac-1', modelName: 'King Air 350', modelNumber: 'BE350', manufacturer: 'Beechcraft' }],
  },
  {
    id: '2', number: '3201', subNumber: '00', type: 'preferred-duncan',
    title: 'Console Map Light Addition',
    companyName: 'Duncan Aviation', companyNumber: '118',
    contactName: 'Priya Raman', contactEmail: 'priya.raman@duncanaviation.example',
    personResponsible: 'Lloyd Pedvis',
    actualHours: 312, budgetHours: 280, priority: '2-high', status: 'active',
    openedDate: '2025-11-12', dueDate: '2026-03-27', aircraftInputDate: '2025-12-05', closedDate: '',
    scope: ['design', 'certification'],
    contractCurrency: 'USD', contractValue: '96000',
    proposalSubmitted: 'yes', proposalSubmittedDate: '2025-11-05', proposalAccepted: 'yes', proposalAcceptedDate: '2025-11-10',
    nextAction: 'Awaiting final sign-off from Duncan on the revised drawing.',
    comments: 'Change to the previously approved console STC — adding map lights.',
    aircraft: [{ id: 'ac-2', modelName: 'King Air 350', modelNumber: 'BE350', manufacturer: 'Beechcraft' }],
  },
  {
    id: '3', number: '3202', subNumber: '01', type: 'preferred-topaces',
    title: 'Wiring Provisions — Underfloor Harness',
    companyName: 'Top Aces', companyNumber: '092',
    contactName: 'Marc Lefebvre', contactEmail: 'marc.lefebvre@topaces.example',
    personResponsible: 'Sofia Reyes',
    actualHours: 128, budgetHours: 400, priority: '3-med', status: 'active',
    openedDate: '2026-02-01', dueDate: '2026-09-15', aircraftInputDate: '', closedDate: '',
    scope: ['design', 'validation'],
    contractCurrency: 'USD', contractValue: '210000',
    proposalSubmitted: 'yes', proposalSubmittedDate: '2026-01-20', proposalAccepted: 'no', proposalAcceptedDate: '',
    nextAction: '', comments: '',
    aircraft: [],
  },
  {
    id: '4', number: '3203', subNumber: '00', type: 'external',
    title: 'Galley Modification — Weight & Balance',
    companyName: 'Abu Dhabi Aviation', companyNumber: '401',
    contactName: 'Yusuf Haddad', contactEmail: 'yusuf.haddad@abudhabiaviation.example',
    personResponsible: 'Remi Rocheleau',
    actualHours: 0, budgetHours: 160, priority: '4-low', status: 'quoted',
    openedDate: '2026-07-01', dueDate: '2026-10-30', aircraftInputDate: '', closedDate: '',
    scope: ['design'],
    contractCurrency: 'USD', contractValue: '', proposalSubmitted: 'no', proposalSubmittedDate: '', proposalAccepted: 'no', proposalAcceptedDate: '',
    nextAction: '', comments: '',
    aircraft: [],
  },
  {
    id: '5', number: '3204', subNumber: '00', type: 'external',
    title: 'iPad Holder Installation — Cockpit',
    companyName: 'Meridian Charter', companyNumber: '377',
    contactName: 'Jane Doe', contactEmail: 'jane.doe@meridiancharter.example',
    personResponsible: 'Kelly Osei',
    actualHours: 96, budgetHours: 96, priority: '3-med', status: 'complete',
    openedDate: '2024-03-04', dueDate: '2024-05-01', aircraftInputDate: '2024-03-10', closedDate: '2024-05-01',
    scope: ['design', 'validation', 'certification'],
    contractCurrency: 'USD', contractValue: '42000',
    proposalSubmitted: 'yes', proposalSubmittedDate: '2024-02-15', proposalAccepted: 'yes', proposalAcceptedDate: '2024-02-20',
    nextAction: '', comments: 'Closed out — certificate issued.',
    aircraft: [{ id: 'ac-3', modelName: 'B737-800', modelNumber: '737-8', manufacturer: 'Boeing' }],
  },
  {
    id: '6', number: '3205', subNumber: '02', type: 'internal',
    title: 'DAO Activities — Process & Procedure Update',
    companyName: 'Elisen', companyNumber: '001',
    contactName: '—', contactEmail: '',
    personResponsible: 'Harris Bell',
    actualHours: 58, budgetHours: 40, priority: '2-high', status: 'active',
    openedDate: '2026-01-15', dueDate: '2026-11-30', aircraftInputDate: '', closedDate: '',
    scope: [], contractCurrency: 'USD', contractValue: '125000', proposalSubmitted: 'no', proposalSubmittedDate: '', proposalAccepted: 'no', proposalAcceptedDate: '',
    nextAction: '', comments: 'Internal DAO cost centre — no customer.',
    aircraft: [],
  },
]

// COMPANIES/CONTACTS moved to the Lookup Tables store (lib/lookupFixtures.ts).
export const PEOPLE = ['Sofia Reyes', 'Lloyd Pedvis', 'Remi Rocheleau', 'Kelly Osei', 'Harris Bell']

/** Numbers already used — drives the duplicate-number validation. */
export const TAKEN_NUMBERS = ['3200', '3201', '3202', '3203', '3204', '3205']
export const NEXT_AVAILABLE_NUMBER = '3206'

/** Next unused 4-digit project number, given the current row set. */
export function getNextProjectNumber(rows: ProjectListRow[]): string {
  const max = rows.reduce((m, r) => Math.max(m, Number(r.number) || 0), Number(NEXT_AVAILABLE_NUMBER) - 1)
  return String(max + 1)
}
