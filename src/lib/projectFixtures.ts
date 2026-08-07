import type { ProjectListRow } from '@/types/project'

/** Obviously-fake demo data for stories and the prototype shell. */
export const PROJECT_ROWS: ProjectListRow[] = [
  {
    id: '1', number: '3200', subNumber: '00', type: 'internal',
    title: 'STC — Cabin Interior Modification, Cert Program',
    companyName: 'Northwind Aerospace', companyNumber: '246',
    contactName: 'Nathalie Gagnon', personResponsible: 'Sofia Reyes',
    actualHours: 44, budgetHours: 80, priority: '1-fire', status: 'quoted',
  },
  {
    id: '2', number: '3201', subNumber: '00', type: 'preferred-duncan',
    title: 'Console Map Light Addition',
    companyName: 'Duncan Aviation', companyNumber: '118',
    contactName: 'Priya Raman', personResponsible: 'Lloyd Pedvis',
    actualHours: 312, budgetHours: 280, priority: '2-high', status: 'active',
  },
  {
    id: '3', number: '3202', subNumber: '01', type: 'preferred-topaces',
    title: 'Wiring Provisions — Underfloor Harness',
    companyName: 'Top Aces', companyNumber: '092',
    contactName: 'Marc Lefebvre', personResponsible: 'Sofia Reyes',
    actualHours: 128, budgetHours: 400, priority: '3-med', status: 'active',
  },
  {
    id: '4', number: '3203', subNumber: '00', type: 'external',
    title: 'Galley Modification — Weight & Balance',
    companyName: 'Abu Dhabi Aviation', companyNumber: '401',
    contactName: 'Yusuf Haddad', personResponsible: 'Remi Rocheleau',
    actualHours: 0, budgetHours: 160, priority: '4-low', status: 'quoted',
  },
  {
    id: '5', number: '3204', subNumber: '00', type: 'external',
    title: 'iPad Holder Installation — Cockpit',
    companyName: 'Meridian Charter', companyNumber: '377',
    contactName: 'Jane Doe', personResponsible: 'Kelly Osei',
    actualHours: 96, budgetHours: 96, priority: '3-med', status: 'complete',
  },
  {
    id: '6', number: '3205', subNumber: '02', type: 'internal',
    title: 'DAO Activities — Process & Procedure Update',
    companyName: 'Elisen', companyNumber: '001',
    contactName: '—', personResponsible: 'Harris Bell',
    actualHours: 58, budgetHours: 40, priority: '2-high', status: 'on-hold',
  },
]

export const COMPANIES = ['Northwind Aerospace', 'Duncan Aviation', 'Top Aces', 'Abu Dhabi Aviation', 'Meridian Charter', 'Elisen']
export const CONTACTS = ['Nathalie Gagnon', 'Priya Raman', 'Marc Lefebvre', 'Yusuf Haddad', 'Jane Doe']
export const PEOPLE = ['Sofia Reyes', 'Lloyd Pedvis', 'Remi Rocheleau', 'Kelly Osei', 'Harris Bell']

/** Numbers already used — drives the duplicate-number validation. */
export const TAKEN_NUMBERS = ['3200', '3201', '3202', '3203', '3204', '3205']
export const NEXT_AVAILABLE_NUMBER = '3206'
