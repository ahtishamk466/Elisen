"""
Convert the client's TPMS mysqldump into the app's fixture shapes.

Business records are carried over verbatim. Every *person* is replaced with a
stable stand-in, and credential / pay columns are never read at all — the
prototype is served publicly with no backend, so anything imported here is
public. See docs/DECISIONS.md.
"""
import json, os, re, collections, zlib

SRC = 'json'
OUT = 'out'
os.makedirs(OUT, exist_ok=True)


def load(t):
    d = json.load(open(f'{SRC}/{t}.json'))
    cols = d['cols']
    return [dict(zip(cols, r)) for r in d['rows']]


T = {t[:-5]: load(t[:-5]) for t in sorted(os.listdir(SRC)) if t.endswith('.json')}
by_id = lambda t, k='id': {r[k]: r for r in T[t]}

# ---------------------------------------------------------------- helpers ---
def s(v):
    """Legacy NULL / placeholder text -> ''."""
    if v is None:
        return ''
    v = str(v).strip()
    return '' if v in ('NULL', 'null') else v


def date(v):
    v = s(v)
    if not v or v.startswith('0000'):
        return ''
    return v[:10]


def num(v, d=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return d


def flag(v):
    return s(v) == '1'


def ts_val(v, indent):
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(round(v, 2) if isinstance(v, float) else v)
    if isinstance(v, list):
        if not v:
            return '[]'
        return '[' + ', '.join(ts_val(x, indent) for x in v) + ']'
    if isinstance(v, dict):
        if not v:
            return '{}'
        inner = ', '.join(f'{json.dumps(k)}: {ts_val(x, indent)}' for k, x in v.items())
        return '{ ' + inner + ' }'
    return json.dumps(v, ensure_ascii=False)


def ts_obj(o):
    return '{ ' + ', '.join(f'{k}: {ts_val(v, 0)}' for k, v in o.items()) + ' }'


def emit(path, header, body):
    open(f'{OUT}/{path}', 'w', encoding='utf-8').write(header + body)
    print(f'  {path:34} {os.path.getsize(f"{OUT}/{path}")/1024:8.1f} KB')


def arr(name, typ, rows):
    return f'export const {name}: {typ}[] = [\n' + ''.join(f'  {ts_obj(r)},\n' for r in rows) + ']\n'


# ------------------------------------------------------- pseudonymisation ---
# Deterministic: sorted real names -> fixed pools, so a re-run is byte-identical
# and every screen keeps the same stand-in for the same person.
FIRST = """Adrian Alma Anders Anika Arjun Astrid Aurelie Bilal Bram Camille Cato Cedric
Chiara Clara Damien Dara Delphine Dmitri Eleni Elias Esme Ewan Fabien Farida Felix Fiona
Gabriel Georgia Gustav Hana Hugo Ilya Imani Ingrid Iris Jonas Joris Juliette Kai Karim
Katya Lars Leila Lena Lucas Maeve Magnus Malik Marek Mariam Mateo Mira Nadia Nils Noor
Olivier Oskar Petra Quentin Rafael Raisa Reza Rosa Rune Sabine Samir Sasha Selma Silas
Sofia Soren Stefan Tamara Theo Tomas Ulrik Vera Viktor Wren Yara Yusuf Zara Zoltan""".split()
LAST = """Aldridge Amara Ansell Barlowe Beaumont Bergstrom Blanchard Caldwell Castellan
Chevalier Dahl Delacroix Devereaux Eastwood Fairweather Falconer Garnier Hallberg Halloway
Hartmann Ivanov Kowalski Lindqvist Lundgren Marchetti Merrick Nakamura Nordholm Okonkwo
Pellerin Prideaux Quintero Ramberg Rasmussen Renaud Ridley Rosenqvist Salvatore Sandoval
Sinclair Solberg Stanford Thibault Vandermeer Vasquez Vaughn Westergaard Whitlock Yilmaz""".split()

_people = {}


def person(real, kind='staff'):
    """A stable stand-in for one real person. '' stays ''."""
    real = s(real)
    if not real:
        return ''
    if real not in _people:
        i = len(_people)
        _people[real] = f'{FIRST[i % len(FIRST)]} {LAST[(i * 7 + kind.__len__()) % len(LAST)]}'
    return _people[real]


def person_email(name, internal=True):
    if not name:
        return ''
    a, b = (name.split() + [''])[:2]
    dom = 'elisen.example' if internal else 'example.com'
    return f'{a}.{b}@{dom}'.lower()


def h(*parts):
    """Stable across runs — Python's str hash is salted per process."""
    return zlib.crc32('|'.join(str(p) for p in parts).encode())


def fake_phone(seed):
    return f'+1 514 555 {h("ph", seed) % 10000:04d}'


def fake_street(seed):
    road = ['Airport Road', 'Aviation Way', 'Hangar Lane', 'Terminal Drive', 'Runway Court'][h('rd', seed) % 5]
    return f'{h("st", seed) % 9000 + 100} {road}'


# ------------------------------------------------------------ enum tables ---
PROJECT_TYPE = {'1': 'internal', '2': 'preferred', '3': 'external', '4': 'other',
                '5': 'preferred-topaces', '6': 'preferred-duncan'}
# 'Dead' is the legacy term for a project that never went ahead; 'Close-Out'
# is late-stage work still in progress.
PROJECT_STATUS = {'Query': 'query', 'Quoted': 'quoted', 'Tentative': 'tentative',
                  'In Progress': 'active', 'Close-Out': 'active', 'On Hold': 'on-hold',
                  'Closed': 'complete', 'Dead': 'cancelled', 'Cancelled': 'cancelled'}
PRIORITY = {'1 - Fire': '1-fire', '2 - High': '2-high', '3 - Med': '3-med',
            '4 - Low': '4-low', '5 - Lowest': '5-lowest'}
REV_STATUS = {'WIP': 'wip', 'In Review': 'in-review', 'In Signatur': 'signature',
              'In Signature': 'signature', 'Accepted': 'accepted', 'Superseded': 'superseded',
              'Not Started': 'wip', 'With TCCA': 'in-review', 'Commented': 'in-review',
              'Cancelled': 'superseded'}
DD_TYPE = {'1': 'GA', '2': 'Detail', '3': 'Assembly', '4': 'Installation', '5': 'Wiring Diagram',
           '6': 'Repair', '7': 'SDD', '8': 'ICD', '9': 'Layout'}
TCCA_STATUS = {'Approved': 'approved', 'Closed': 'closed'}
TCCA_PROJ_STATUS = {'Pending': 'not-started', 'Active': 'in-progress', 'Open Items': 'in-progress',
                    'Dormant': 'on-hold', 'Completed': 'complete', 'Cancelled': 'cancelled'}
TCCA_LEVEL = {'Major': 'major', 'Minor': 'minor'}
DOC_STATE = {'No Involvement': 'not-sent', 'TBD': 'not-sent', 'With TC': 'sent',
             'Accepted': 'accepted', 'accepted': 'accepted', 'Accepted W/C': 'accepted',
             'Comments': 'comments', 'Superseded': 'accepted', 'Cancelled': 'not-sent'}
INVOLVEMENT = {'NA': 'none', 'NI': 'none', 'I': 'review', 'R': 'review', 'R/W': 'review',
               'W': 'review', 'A': 'approve', 'A/A': 'approve', 'A/NI': 'approve', 'A/W': 'approve'}

HDR = ('/* Generated from the client TPMS database export (2026-08-27).\n'
       '   People are stand-ins; business records are the client\'s own.\n'
       '   Regenerate with tools/import-tpms.py — do not hand-edit. */\n')


# ============================================================ people first ===
profiles = T['userprofile']
users_by_id = by_id('user')

# Person id -> stand-in name. Sorted for determinism.
STAFF = {}
for p in sorted(profiles, key=lambda r: int(r['id'])):
    STAFF[p['id']] = person(s(p['full_name']) or f"user-{p['id']}")

CONTACT_NAME = {}
for c in sorted(T['contact'], key=lambda r: int(r['id'])):
    CONTACT_NAME[c['id']] = person(s(c['full_name']) or f"contact-{c['id']}", 'contact')

print('people:', len(STAFF), 'staff,', len(CONTACT_NAME), 'contacts ->', len(_people), 'stand-ins')

# --------------------------------------------------------------- employees ---
emps = []
for p in sorted(profiles, key=lambda r: STAFF[r['id']]):
    emps.append({
        'name': STAFF[p['id']],
        'designation': s(p['function']) or 'Not set',
        'payrollGroup': f"Group {s(p['payroll_group']) or '0'}",
        'active': flag(p['active']),
    })
PEOPLE_NAMES = [e['name'] for e in emps]

emit('employeeFixtures.ts', HDR + "import type { Employee } from '@/types/employee'\n"
     "import { PEOPLE } from './projectFixtures'\n\n",
     arr('EMPLOYEES', 'Employee', emps) + """
export const PAYROLL_GROUPS = [...new Set(EMPLOYEES.map((e) => e.payrollGroup))].sort()

const BY_NAME = new Map(EMPLOYEES.map((e) => [e.name, e]))

export const employeeByName = (name: string): Employee | undefined => BY_NAME.get(name)

/** Names that appear on work but have no staff record. */
export const UNKNOWN_ASSIGNEES = PEOPLE.filter((p) => !BY_NAME.has(p))
""")

# --------------------------------------------------------------- lookups -----
companies = []
for c in sorted(T['company'], key=lambda r: int(r['id'])):
    addr = ' '.join(x for x in [s(c['address_line1']), s(c['address_line2']), s(c['prov_state'])] if x)
    companies.append({'id': f"co-{c['id']}", 'name': s(c['name']) or f"Company {c['id']}",
                      'address': addr, 'city': s(c['city']), 'country': s(c['country']),
                      'postal': s(c['postal_zipcode']), 'active': flag(c['active'])})

contacts = []
for c in sorted(T['contact'], key=lambda r: int(r['id'])):
    nm = CONTACT_NAME[c['id']]
    contacts.append({'id': f"ct-{c['id']}", 'companyId': f"co-{s(c['company_id'])}", 'fullName': nm,
                     'phoneCountryCode': '+1', 'phoneNumber': fake_phone(c['id'])[-8:].strip(),
                     'active': flag(c['active'])})

models = []
for a in sorted(T['aircraft'], key=lambda r: int(r['id'])):
    models.append({'id': f"ac-{a['id']}", 'modelNumber': s(a['model_number']),
                   'modelName': s(a['model_name']), 'manufacturer': s(a['manufacture']),
                   'tccaTc': s(a['tcca_tc']), 'faaTc': s(a['faa_tc']), 'easaTc': s(a['easa_tc']),
                   'drawingPrefix': s(a['dwg_prefix']), 'active': flag(a['active'])})

serials = []
for n in sorted(T['serialnumber'], key=lambda r: int(r['id'])):
    owner = person(s(n['name']) or f"owner-{n['id']}", 'owner') if s(n['name']) else ''
    serials.append({'id': f"sn-{n['id']}", 'aircraftId': f"ac-{s(n['aircraft_id'])}",
                    'serial': s(n['serial_number']), 'registration': s(n['registration_number']),
                    'ownerName': owner, 'company': s(n['company']),
                    'addressLine1': fake_street(n['id']) if s(n['address_line1']) else '',
                    'addressLine2': '', 'city': s(n['city']), 'provState': s(n['prov_state']),
                    'country': s(n['country']), 'postalZipcode': s(n['postal_zipcode']),
                    'telephone': fake_phone(n['id']) if s(n['telephone_no']) else '',
                    'email': person_email(owner, False) if owner and s(n['email']) else '',
                    'comment': s(n['comment']), 'active': flag(n['active'])})

chapters, subs = [], []
for c in sorted(T['atachapter'], key=lambda r: int(r['sort'] or 0)):
    chapters.append({'id': f"ata-{c['id']}", 'chapter': s(c['chapter']), 'title': s(c['title']),
                     'definition': s(c['definition']), 'sort': int(num(c['sort'])),
                     'active': flag(c['active'])})
for c in sorted(T['atasubchapter'], key=lambda r: int(r['sort'] or 0)):
    subs.append({'id': f"atas-{c['id']}", 'chapterId': f"ata-{s(c['atachapter_id'])}",
                 'section': s(c['section']), 'title': s(c['title']), 'definition': s(c['definition']),
                 'sort': int(num(c['sort'])), 'active': flag(c['active'])})

emit('lookupFixtures.ts', HDR + "import type {\n  AircraftModel, AircraftSerial, AtaChapter, AtaSubChapter, Company, CompanyContact,\n} from '@/types/lookup'\n\n",
     arr('COMPANIES_LOOKUP', 'Company', companies) + '\n' +
     arr('COMPANY_CONTACTS', 'CompanyContact', contacts) + '\n' +
     arr('AIRCRAFT_MODELS', 'AircraftModel', models) + '\n' +
     arr('AIRCRAFT_SERIALS', 'AircraftSerial', serials) + '\n' +
     arr('ATA_CHAPTERS', 'AtaChapter', chapters) + '\n' +
     arr('ATA_SUB_CHAPTERS', 'AtaSubChapter', subs))

# --------------------------------------------------------------- catalog -----
acts, tasks, links = [], [], []
for a in sorted(T['activity'], key=lambda r: int(r['id'])):
    title = s(a['title'])
    if title == '*':
        continue
    acts.append({'id': f"act-{a['id']}", 'name': title, 'description': s(a['description']),
                 'taskRequired': flag(a['task_required']), 'isDefault': flag(a['default']),
                 'nonProject': title.upper().startswith('GEN'), 'active': flag(a['active'])})
for t in sorted(T['task'], key=lambda r: int(r['id'])):
    tasks.append({'id': f"tsk-{t['id']}", 'name': s(t['title']), 'active': flag(t['active'])})
for l in sorted(T['activity_task'], key=lambda r: int(r['id'])):
    links.append({'id': f"at-{l['id']}", 'activityId': f"act-{s(l['activity_id'])}",
                  'taskId': f"tsk-{s(l['task_id'])}", 'active': flag(l['active'])})

emit('catalogFixtures.ts', HDR + "import type { Activity, ActivityTask, Task } from '@/types/catalog'\n\n",
     arr('ACTIVITIES', 'Activity', acts) + '\n' + arr('TASKS', 'Task', tasks) + '\n' +
     arr('ACTIVITY_TASK_LINKS', 'ActivityTask', links) + """
const TASK_BY_ID = new Map(TASKS.map((t) => [t.id, t]))

/** Task name for a catalog id — the app stores task *names* on entries. */
export const taskId = (name: string) =>
  TASKS.find((t) => t.name === name)?.id ?? ''

export const tasksOfActivity = (activityId: string) =>
  ACTIVITY_TASK_LINKS.filter((l) => l.activityId === activityId && l.active)
    .map((l) => TASK_BY_ID.get(l.taskId))
    .filter(Boolean) as Task[]
""")
print('catalog:', len(acts), 'activities,', len(tasks), 'tasks,', len(links), 'links')

# --------------------------------------------------------------- projects ---
co = by_id('company'); ct = by_id('contact'); ac = by_id('aircraft'); sn = by_id('serialnumber')

actual_by_project = collections.defaultdict(float)
for e in T['hoursworked']:
    if flag(e['active']):
        actual_by_project[s(e['project_id'])] += num(e['hours'])

budget_by_project = collections.defaultdict(float)
budget_by_wp = collections.defaultdict(float)
for a in T['project_activity']:
    budget_by_project[s(a['project_id'])] += num(a['budgeted_hours'])
    budget_by_wp[s(a['work_package_id'])] += num(a['budgeted_hours'])

aircraft_of_project = collections.defaultdict(list)
for pa in sorted(T['project_aircraft'], key=lambda r: int(r['id'])):
    m = ac.get(s(pa['aircraft_id']))
    if not m:
        continue
    aircraft_of_project[s(pa['project_id'])].append({
        'id': f"pa-{pa['id']}", 'modelName': s(m['model_name']), 'modelNumber': s(m['model_number']),
        'manufacturer': s(m['manufacture']), 'aircraftId': f"ac-{m['id']}",
    })

SCOPES = [('scope_design', 'design'), ('scope_validation', 'validation'),
          ('scope_certification', 'certification'), ('scope_parts_kit', 'parts-kit'),
          ('scope_aircraft_mod', 'aircraft-mod')]

projects = []
for p in sorted(T['project'], key=lambda r: (s(r['number']), s(r['sub_number']))):
    pid = p['id']
    company = co.get(s(p['company_id']))
    contact = ct.get(s(p['contact_id']))
    projects.append({
        'id': f"p-{pid}", 'number': s(p['number']), 'subNumber': s(p['sub_number']) or '00',
        'type': PROJECT_TYPE.get(s(p['type']), 'other'),
        'title': s(p['description']) or f"Project {s(p['fullnumber'])}",
        'companyName': s(company['name']) if company else '',
        'companyNumber': f"co-{company['id']}" if company else '',
        'contactName': CONTACT_NAME.get(s(p['contact_id']), '') if contact else '',
        'contactEmail': person_email(CONTACT_NAME.get(s(p['contact_id']), ''), False) if contact else '',
        'personResponsible': STAFF.get(s(p['person_responsible_userprofile_id']), ''),
        'actualHours': round(actual_by_project.get(pid, 0.0), 2),
        'budgetHours': round(budget_by_project.get(pid, 0.0), 2),
        'priority': PRIORITY.get(s(p['priority']), '5-lowest'),
        'status': PROJECT_STATUS.get(s(p['status']), 'query'),
        'active': flag(p['active']),
        'openedDate': date(p['project_opened_date']), 'dueDate': date(p['due_date']),
        'aircraftInputDate': date(p['aircraft_input_date']), 'closedDate': date(p['closed_date']),
        'scope': [k for c, k in SCOPES if flag(p[c])],
        'contractCurrency': s(p['currency']), 'contractValue': s(p['contract_value']),
        'proposalSubmitted': 'yes' if s(p['proposal_submitted']) == 'YES' else 'no',
        'proposalSubmittedDate': date(p['proposal_submitted_date']),
        'proposalAccepted': 'yes' if s(p['proposal_accepted']) == 'YES' else 'no',
        'proposalAcceptedDate': date(p['proposal_accepted_date']),
        'nextAction': s(p['next_action']), 'comments': s(p['comments']),
        'aircraft': aircraft_of_project.get(pid, []),
    })

numbers = sorted({r['number'] for r in projects if r['number'].isdigit()}, key=int)
next_num = str(int(numbers[-1]) + 1).zfill(4) if numbers else '0001'

emit('projectFixtures.ts', HDR + "import type { ProjectListRow } from '@/types/project'\n\n",
     arr('PROJECT_ROWS', 'ProjectListRow', projects) + f"""
/** Names that can be assigned to work, from the client's staff list. */
export const PEOPLE = {ts_val(PEOPLE_NAMES, 0)}

export const TAKEN_NUMBERS = Array.from(new Set(PROJECT_ROWS.map((r) => r.number)))
export const NEXT_AVAILABLE_NUMBER = '{next_num}'

/** Lowest unused 4-digit number at or above the highest on record. */
export function getNextProjectNumber(rows: ProjectListRow[]): {{ number: string }} {{
  const taken = new Set(rows.map((r) => r.number))
  let n = Number(NEXT_AVAILABLE_NUMBER)
  while (taken.has(String(n).padStart(4, '0'))) n += 1
  return {{ number: String(n).padStart(4, '0') }}
}}
""")

# review + coverage screens read the same rows
emit('reviewFixtures.ts', HDR, "export { PROJECT_ROWS as REVIEW_ROWS } from './projectFixtures'\n")

# ---------------------------------------------------------- work packages ---
wps, wpacts = [], []
WP_STATUS = {'Open': 'in-progress', 'Closed': 'complete'}
for w in sorted(T['work_package'], key=lambda r: int(r['id'])):
    wps.append({'id': f"wp-{w['id']}", 'projectId': f"p-{s(w['project_id'])}",
                'title': s(w['title']) or 'Default Work Package',
                'description': s(w['description']),
                'status': WP_STATUS.get(s(w['status']), 'in-progress')})

# The legacy table has no responsible person on an activity; the project's own
# person responsible is who owns the work, so it carries through.
resp_of_project = {f"p-{p['id']}": STAFF.get(s(p['person_responsible_userprofile_id']), '') for p in T['project']}
actual_by_pa = collections.defaultdict(float)
for e in T['hoursworked']:
    if flag(e['active']):
        actual_by_pa[(s(e['work_package_id']), s(e['activity_id']))] += num(e['hours'])

for a in sorted(T['project_activity'], key=lambda r: int(r['id'])):
    wpacts.append({'id': f"wpa-{a['id']}", 'workPackageId': f"wp-{s(a['work_package_id'])}",
                   'activityId': f"act-{s(a['activity_id'])}",
                   'responsible': resp_of_project.get(f"p-{s(a['project_id'])}", ''),
                   'budgetHours': round(num(a['budgeted_hours']), 2),
                   'actualHours': round(actual_by_pa.get((s(a['work_package_id']), s(a['activity_id'])), 0.0), 2)})

emit('workPackageFixtures.ts', HDR + "import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'\n\n",
     arr('WORK_PACKAGES', 'WorkPackage', wps) + '\n' + arr('WP_ACTIVITIES', 'WorkPackageActivity', wpacts))
print('projects:', len(projects), '| work packages:', len(wps), '| wp activities:', len(wpacts))

# Free-text owner / next-action fields hold a mix of people and organisations.
# Anything matching a real person we already replaced is swapped; org names stay.
def maybe_person(v):
    v = s(v)
    return _people.get(v, v)


# --- free-text scrubbing -----------------------------------------------------
# Comments and next-action notes are prose written by staff, and they name
# colleagues and customer contacts. A public build cannot carry those, so every
# string that reaches the output is passed through here.
REAL_FULL = {}
for _t, _c in (('userprofile', 'full_name'), ('contact', 'full_name'), ('serialnumber', 'name')):
    for _r in T[_t]:
        _n = s(_r[_c])
        if len(_n.split()) >= 2:
            REAL_FULL[_n] = _people.get(_n) or person(_n)

_FIRSTS = {n.split()[0] for n in REAL_FULL}
_LASTS = {n.split()[-1] for n in REAL_FULL}
# Longest first, so "Jean Pierre Dubois" wins over "Jean Pierre".
_NAME_RE = re.compile('|'.join(re.escape(n) for n in sorted(REAL_FULL, key=len, reverse=True))) if REAL_FULL else None
_BIGRAM_RE = re.compile(r'\b([A-Z][a-zA-Z\'-]+) ([A-Z][a-zA-Z\'-]+)\b')
_EMAIL_RE = re.compile(r'\b[\w.+-]+@[\w-]+\.[\w.]+\b')
_scrub_hits = collections.Counter()


def scrub(text):
    if not text or not isinstance(text, str):
        return text
    out = text
    if _NAME_RE:
        def _one(m):
            _scrub_hits['full'] += 1
            return REAL_FULL[m.group(0)]
        out = _NAME_RE.sub(_one, out)

    def _bi(m):
        a, b = m.group(1), m.group(2)
        if a in _FIRSTS and b in _LASTS:
            _scrub_hits['bigram'] += 1
            return person(f'{a} {b}', 'text')
        return m.group(0)
    out = _BIGRAM_RE.sub(_bi, out)

    def _mail(m):
        _scrub_hits['email'] += 1
        return 'name@example.com'
    return _EMAIL_RE.sub(_mail, out)


def walk(v):
    """Scrub every string in a nested structure."""
    if isinstance(v, str):
        return scrub(v)
    if isinstance(v, list):
        return [walk(x) for x in v]
    if isinstance(v, dict):
        return {k: walk(x) for k, x in v.items()}
    return v

# -------------------------------------------------------------- documents ---
docs, revs, links_pr = [], [], []
atac = by_id('atachapter')

for d in sorted(T['deliverable'], key=lambda r: int(r['id'])):
    docs.append({'id': f"dl-{d['id']}", 'kind': 'deliverable', 'number': s(d['number']),
                 'title': s(d['title']), 'type': s(d['deliverable_type']),
                 'owner': maybe_person(d['person_responsible'])})
for d in sorted(T['designdata'], key=lambda r: int(r['id'])):
    m = ac.get(s(d['aircraft_id'])); ch = atac.get(s(d['atachapter_id']))
    docs.append({'id': f"dd-{d['id']}", 'kind': 'drawing', 'number': s(d['number']),
                 'title': s(d['title']), 'type': DD_TYPE.get(s(d['type']), 'Detail'),
                 'owner': s(d['discipline']),
                 'aircraft': s(m['model_number']) if m else '',
                 'ataChapter': s(ch['chapter']) if ch else ''})

for r in sorted(T['deliverablerev'], key=lambda x: int(x['id'])):
    revs.append({'id': f"dlr-{r['id']}", 'documentId': f"dl-{s(r['deliverable_id'])}",
                 'rev': s(r['revision']) or 'A', 'initialProjectId': f"p-{s(r['initial_project_id'])}" if s(r['initial_project_id']) else '',
                 'openedDate': date(r['opened_date']), 'dueDate': date(r['due_date']),
                 'releasedDate': date(r['released_date']), 'receivedDate': date(r['received_date']),
                 'closedDate': date(r['closed_date']), 'nextAction': maybe_person(r['next_action']),
                 'url': s(r['url']), 'status': REV_STATUS.get(s(r['status']), 'wip')})
for r in sorted(T['designdatarev'], key=lambda x: int(x['id'])):
    revs.append({'id': f"ddr-{r['id']}", 'documentId': f"dd-{s(r['designdata_id'])}",
                 'rev': s(r['revision']) or 'A', 'initialProjectId': f"p-{s(r['initial_project_id'])}" if s(r['initial_project_id']) else '',
                 'openedDate': date(r['opened_date']), 'dueDate': date(r['due_date']),
                 'releasedDate': date(r['released_date']), 'receivedDate': date(r['received_date']),
                 'closedDate': date(r['closed_date']), 'nextAction': maybe_person(r['next_action']),
                 'url': s(r['url']), 'status': REV_STATUS.get(s(r['status']), 'wip')})

for l in sorted(T['project_deliverablerev'], key=lambda r: int(r['id'])):
    links_pr.append({'id': f"prl-{l['id']}", 'projectId': f"p-{s(l['project_id'])}",
                     'revisionId': f"dlr-{s(l['deliverablerev_id'])}"})
for l in sorted(T['project_designdatarev'], key=lambda r: int(r['id'])):
    links_pr.append({'id': f"pdl-{l['id']}", 'projectId': f"p-{s(l['project_id'])}",
                     'revisionId': f"ddr-{s(l['designdatarev_id'])}"})

# --------------------------------------------------------------- approvals ---
ap_projects = collections.defaultdict(list)
for l in T['project_approval']:
    ap_projects[s(l['approval_id'])].append(f"p-{s(l['project_id'])}")
ap_aircraft = collections.defaultdict(list)
for l in T['approval_aircraft']:
    ap_aircraft[s(l['approval_id'])].append(f"ac-{s(l['aircraft_id'])}")
ap_serials = collections.defaultdict(list)
for l in T['approval_serialnumber']:
    ap_serials[s(l['approval_id'])].append(f"sn-{s(l['serialnumber_id'])}")

approvals = []
for a in sorted(T['approval'], key=lambda r: s(r['number'])):
    approvals.append({'id': f"ap-{a['id']}", 'number': s(a['number']), 'description': s(a['description']),
                      'primary': flag(a['primary_approval']),
                      'designApprovalHolder': s(a['design_approval_holder']),
                      'comment': s(a['comment']), 'active': flag(a['active']),
                      'projectIds': ap_projects.get(a['id'], []),
                      'aircraftIds': ap_aircraft.get(a['id'], []),
                      'serialIds': ap_serials.get(a['id'], [])})

ap_revs = []
for r in sorted(T['approvalissue'], key=lambda x: (s(x['approval_id']), num(x['approval_issue']))):
    ap_revs.append({'id': f"apr-{r['id']}", 'approvalId': f"ap-{s(r['approval_id'])}",
                    'revision': int(num(r['approval_issue'], 1)),
                    'changeDescription': s(r['change_description']),
                    'revisionDate': date(r['issue_date']), 'document': s(r['approval_document'])})

emit('documentFixtures.ts', HDR + "import type {\n  Approval, ApprovalRevision, DocRevision, ProjectDocument, ProjectRevisionLink,\n} from '@/types/documents'\n\n",
     arr('DOCUMENTS', 'ProjectDocument', docs) + '\n' +
     arr('DOC_REVISIONS', 'DocRevision', revs) + '\n' +
     arr('PROJECT_REVISION_LINKS', 'ProjectRevisionLink', links_pr) + '\n' +
     arr('APPROVALS', 'Approval', approvals) + '\n' +
     arr('APPROVAL_REVISIONS', 'ApprovalRevision', ap_revs))
print('documents:', len(docs), '| revisions:', len(revs), '| project links:', len(links_pr),
      '| approvals:', len(approvals), '| approval revisions:', len(ap_revs))

# -------------------------------------------------------------------- TCCA ---
tcca_projects_of = collections.defaultdict(list)
for l in T['tccaproject_project']:
    tcca_projects_of[s(l['tccaproject_id'])].append(f"p-{s(l['project_id'])}")

tccas = []
for t in sorted(T['tccaproject'], key=lambda r: s(r['number'])):
    tccas.append({'id': f"tp-{t['id']}", 'number': s(t['number']), 'description': s(t['description']),
                  'priority': s(t['priority']) or '9.0', 'certificate': s(t['certificate']),
                  'issueNumber': s(t['issue_number']), 'issued': flag(t['issued']),
                  'status': TCCA_STATUS.get(s(t['status']), 'in-progress'),
                  'projectStatus': TCCA_PROJ_STATUS.get(s(t['project_status']), 'in-progress'),
                  'projectLevel': TCCA_LEVEL.get(s(t['project_level']), 'not-assigned'),
                  'openedDate': date(t['start_date']), 'closedDate': date(t['closed_date']),
                  'expectedFaiDate': date(t['expected_fai_date']),
                  'expectedTestingDate': date(t['expected_testing_date']),
                  'expectedApprovalDate': date(t['expected_approval_date']),
                  'expectedDeliveryDate': date(t['expected_delivery_date']),
                  'nextAction': '', 'comments': s(t['comment']),
                  'projectIds': tcca_projects_of.get(t['id'], []), 'checklist': {}})

doc_links = []
for l in sorted(T['tccadocstatus'], key=lambda r: int(r['id'])):
    doc_links.append({'id': f"tdl-{l['id']}", 'tccaProjectId': f"tp-{s(l['tccaproject_id'])}",
                      'revisionId': f"dlr-{s(l['deliverablerev_id'])}",
                      'involvement': INVOLVEMENT.get(s(l['loi_code']), 'none'),
                      'sentDate': date(l['tcca_accepted_date']),
                      'state': DOC_STATE.get(s(l['status']), 'not-sent')})

emit('tccaFixtures.ts', HDR + "import type { TccaDocLink, TccaProject } from '@/types/tcca'\n\n",
     arr('TCCA_PROJECTS', 'TccaProject', tccas) + '\n' + arr('TCCA_DOC_LINKS', 'TccaDocLink', doc_links) + """
/** Next number in the client's A-YY-NNNN series. */
export function getNextTccaNumber(existing: TccaProject[]): string {
  const year = String(new Date().getFullYear()).slice(-2)
  const prefix = `A-${year}-`
  const used = existing
    .filter((t) => t.number.startsWith(prefix))
    .map((t) => Number(t.number.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n))
  const next = used.length ? Math.max(...used) + 1 : 1
  return `${prefix}${String(next).padStart(4, '0')}`
}
""")
print('tcca:', len(tccas), 'projects,', len(doc_links), 'doc links')

# ---------------------------------------------------------------- settings ---
setts = []
for st in sorted(T['setting'], key=lambda r: int(r['id'])):
    setts.append({'id': f"set-{st['id']}", 'type': s(st['type']) or 'string',
                  'section': s(st['section']), 'key': s(st['key']), 'value': s(st['value']),
                  'description': s(st['description']), 'active': s(st['status']) == '1'})
emit('settingFixtures.ts', HDR + "import type { SettingType, SoftwareSetting } from '@/types/setting'\n\n",
     """export const SETTING_TYPE_LABEL: Record<SettingType, string> = {
  string: 'String', integer: 'Integer', boolean: 'Boolean', float: 'Float', null: 'Null',
}

""" + arr('SOFTWARE_SETTINGS', 'SoftwareSetting', setts))
print('settings:', len(setts))

# ------------------------------------------------------------- timesheet ----
wp_of = {w['id']: w for w in T['work_package']}
act_ids = {a['id'] for a in T['activity']}
task_by_id = by_id('task')
dlr_ids = {r['id'] for r in T['deliverablerev']}

entries = []
for e in sorted(T['hoursworked'], key=lambda r: (date(r['working_date']), int(r['id']))):
    wd = date(e['working_date'])
    if not wd:
        continue
    tsk = task_by_id.get(s(e['task_id']))
    entries.append({
        'id': f"hw-{e['id']}",
        'employeeName': STAFF.get(s(e['user_id']), '') or person(s(e['username']) or f"u{e['user_id']}"),
        'projectId': f"p-{s(e['project_id'])}" if s(e['project_id']) else '',
        'workPackageId': f"wp-{s(e['work_package_id'])}" if s(e['work_package_id']) else '',
        'activityId': f"act-{s(e['activity_id'])}" if s(e['activity_id']) in act_ids else '',
        'task': s(tsk['title']) if tsk else '',
        'deliverableRevisionId': f"dlr-{s(e['deliverable_id'])}" if s(e['deliverable_id']) in dlr_ids else '',
        'workingDate': wd,
        'hoursRegular': round(num(e['hours']), 2),
        'hoursOvertime': round(num(e['hours_overtime']), 2),
        'bankHoursRegular': round(num(e['banked_regular_hours']), 2),
        'comment': s(e['comment']),
        'validated': flag(e['validation']),
        'active': flag(e['active']),
    })
print('timesheet entries:', len(entries))

# ------------------------------------------------------------ JSON output ---
os.makedirs(f'{OUT}/data', exist_ok=True)
DATA = {
    'projects': projects, 'workPackages': wps, 'wpActivities': wpacts,
    'companies': companies, 'contacts': contacts, 'aircraft': models, 'serials': serials,
    'ataChapters': chapters, 'ataSubChapters': subs,
    'documents': docs, 'docRevisions': revs, 'projectRevisionLinks': links_pr,
    'approvals': approvals, 'approvalRevisions': ap_revs,
    'tccaProjects': tccas, 'tccaDocLinks': doc_links,
    'timesheet': entries,
}
DATA = {k: walk(v) for k, v in DATA.items()}
print('scrubbed from free text:', dict(_scrub_hits))

import gzip as _gz
tot_raw = tot_gz = 0
for k, v in DATA.items():
    b = json.dumps(v, ensure_ascii=False, separators=(',', ':')).encode()
    open(f'{OUT}/data/{k}.json', 'wb').write(b)
    g = len(_gz.compress(b, 6))
    tot_raw += len(b); tot_gz += g
    print(f'  data/{k:24} {len(b)/1024:9.1f} KB  gz {g/1024:8.1f} KB   ({len(v)} rows)')
print(f'  {"TOTAL":30} {tot_raw/1024/1024:8.2f} MB  gz {tot_gz/1024/1024:6.2f} MB')

# ------------------------------------------------------------------ RBAC ----
# auth_item.type: 1 = role, 2 = permission. Permissions whose name is a path
# are the guarded routes themselves; named ones are the app's own permissions.
items = T['auth_item']
roles_raw = [r for r in items if s(r['type']) == '1']
perms_raw = [r for r in items if s(r['type']) == '2']
route_names = {s(r['name']) for r in perms_raw if s(r['name']).startswith('/')}
named_perms = [r for r in perms_raw if not s(r['name']).startswith('/')]

children = collections.defaultdict(list)
for c in T['auth_item_child']:
    children[s(c['parent'])].append(s(c['child']))

perm_ids = {s(p['name']) for p in named_perms}
role_ids = {s(r['name']) for r in roles_raw}

permissions = []
for p in sorted(named_perms, key=lambda r: s(r['name'])):
    nm = s(p['name'])
    permissions.append({'id': nm, 'description': s(p['description']) or nm,
                        'routes': sorted(x for x in children.get(nm, []) if x in route_names)})

roles = []
for r in sorted(roles_raw, key=lambda x: s(x['name'])):
    nm = s(r['name'])
    kids = children.get(nm, [])
    roles.append({'id': nm, 'name': nm.strip(), 'description': s(r['description']) or nm.strip(),
                  'permissionIds': sorted(k for k in kids if k in perm_ids),
                  'childRoleIds': sorted(k for k in kids if k in role_ids)})

assign = collections.defaultdict(list)
for a in T['auth_assignment']:
    assign[s(a['user_id'])].append(s(a['item_name']))

users_out = []
for p in sorted(profiles, key=lambda r: STAFF[r['id']]):
    uid = s(p['user_id'])
    u = users_by_id.get(uid)
    nm = STAFF[p['id']]
    # username and email are derived from the stand-in; the real ones, the
    # password hash and the auth key are never read.
    users_out.append({'id': f"u-{p['id']}", 'username': nm.lower().replace(' ', '.'),
                      'email': person_email(nm), 'status': 'active' if flag(p['active']) else 'inactive',
                      'roleIds': sorted(x for x in assign.get(uid, []) if x in role_ids),
                      'directPermissionIds': sorted(x for x in assign.get(uid, []) if x in perm_ids)})

emit('accessFixtures.ts', HDR + "import type {\n  AccessPermission, AccessRole, AccessRule, AccessUser,\n} from '@/types/access'\n\n",
     "export const ACCESS_RULES: AccessRule[] = []\n\n" +
     arr('ACCESS_PERMISSIONS', 'AccessPermission', permissions) + '\n' +
     f"export const ROUTE_REGISTRY: string[] = {ts_val(sorted(route_names), 0)}\n\n" +
     "const GRANTED = new Set(ACCESS_PERMISSIONS.flatMap((p) => p.routes))\n\n"
     "/** Routes no permission covers — visible so a gap can't hide. */\n"
     "export const UNASSIGNED_ROUTES = ROUTE_REGISTRY.filter((r) => !GRANTED.has(r))\n\n" +
     arr('ACCESS_ROLES', 'AccessRole', roles) + '\n' +
     arr('ACCESS_USERS', 'AccessUser', users_out))
print('rbac:', len(roles), 'roles,', len(permissions), 'permissions,', len(route_names), 'routes,', len(users_out), 'users')

# ------------------------------------- slim TS: names + numbers only ---------
emit('projectFixtures.ts', HDR, f"""/** Staff who can be assigned to work. */
export const PEOPLE = {ts_val(PEOPLE_NAMES, 0)}

export const NEXT_AVAILABLE_NUMBER = '{next_num}'

/** Lowest unused 4-digit number at or above the highest on record. */
export function getNextProjectNumber(rows: {{ number: string }}[]): {{ number: string }} {{
  const taken = new Set(rows.map((r) => r.number))
  let n = Number(NEXT_AVAILABLE_NUMBER)
  while (taken.has(String(n).padStart(4, '0'))) n += 1
  return {{ number: String(n).padStart(4, '0') }}
}}
""")

for gone in ('reviewFixtures.ts', 'workPackageFixtures.ts', 'documentFixtures.ts',
             'tccaFixtures.ts', 'lookupFixtures.ts'):
    p = f'{OUT}/{gone}'
    if os.path.exists(p):
        os.remove(p)
print('\nTS fixtures kept:', sorted(f for f in os.listdir(OUT) if f.endswith('.ts')))

# ------------------------------------- small TS shims the components import --
taken = sorted({p['number'] for p in projects if p['number']})
busiest = collections.Counter(e['employeeName'] for e in entries if e['employeeName']).most_common(1)
current_employee = busiest[0][0] if busiest else (PEOPLE_NAMES[0] if PEOPLE_NAMES else '')

emit('projectFixtures.ts', HDR, f"""/** Staff who can be assigned to work. */
export const PEOPLE = {ts_val(PEOPLE_NAMES, 0)}

/** Project numbers already in use, for duplicate checking on the create form. */
export const TAKEN_NUMBERS: string[] = {ts_val(taken, 0)}

export const NEXT_AVAILABLE_NUMBER = '{next_num}'

/** Lowest unused 4-digit number at or above the highest on record. */
export function getNextProjectNumber(rows: {{ number: string }}[]): {{ number: string }} {{
  const taken = new Set([...TAKEN_NUMBERS, ...rows.map((r) => r.number)])
  let n = Number(NEXT_AVAILABLE_NUMBER)
  while (taken.has(String(n).padStart(4, '0'))) n += 1
  return {{ number: String(n).padStart(4, '0') }}
}}
""")

emit('tccaFixtures.ts', HDR + "import type { TccaProject } from '@/types/tcca'\n\n",
     """/** Next number in the client's A-YY-NNNN series. */
export function getNextTccaNumber(existing: TccaProject[]): string {
  const year = String(new Date().getFullYear()).slice(-2)
  const prefix = `A-${year}-`
  const used = existing
    .filter((t) => t.number.startsWith(prefix))
    .map((t) => Number(t.number.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n))
  return `${prefix}${String(used.length ? Math.max(...used) + 1 : 1).padStart(4, '0')}`
}
""")

emit('timesheetFixtures.ts', HDR,
     f"""/** Whose timesheet the self-service screen shows — the person with the most
    entries on record, so the demo screen is never empty. */
export const CURRENT_EMPLOYEE = {json.dumps(current_employee)}
""")
print('current employee:', current_employee, '| taken numbers:', len(taken))
