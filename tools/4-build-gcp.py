"""GCP reference data from the dump: every regulation, subsection and
certification basis, and which TCCA project uses which basis.

    python3 4-build-gcp.py <pmtts_*.sql.gz>   # -> out/data/{regulations,subsections,certBases}.json

Reads the dump directly (no step 1/2 needed). These tables hold regulation
text and aircraft names, no people, and audit columns (`created_by` etc.) are
never read. The run still stops if an email address reaches the output.
"""
import gzip, importlib, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
_parse = importlib.import_module('2-parse-tables')
parse_values, cols_for = _parse.parse_values, _parse.cols_for

TABLES = {'mastercertbasis', 'certbasis', 'regulation', 'subpart', 'subsection', 'tccaproject'}


def read_tables(path):
    ddl, inserts, cur, buf = [], {t: [] for t in TABLES}, None, []
    with gzip.open(path, 'rt', encoding='utf-8', errors='replace') as f:
        for line in f:
            m = re.match(r'^CREATE TABLE `([^`]+)`', line)
            if m:
                cur, buf = m.group(1), [line]
                continue
            if cur:
                buf.append(line)
                if line.startswith(') ENGINE'):
                    if cur in TABLES:
                        ddl.append(''.join(buf))
                    cur = None
                continue
            m = re.match(r'^INSERT INTO `([^`]+)` VALUES ', line)
            if m and m.group(1) in TABLES:
                inserts[m.group(1)].append(line)
    ddl = '\n'.join(ddl)
    return {t: [dict(zip(cols_for(t, ddl), r)) for r in parse_values(''.join(inserts[t]))] for t in TABLES}


def s(v):
    return (v or '').strip() if isinstance(v, str) else ''


# A basis code is "<model>_<TCDS>" (Harris, 2026-09-09), e.g. DHC-8-3XX_A-142,
# B747-400_A20WE. A project-specific basis (1617_TIA, A4N_23-14) has no TCDS
# segment, so it stays blank and the app labels it Project-specific.
TCDS_SEGMENT = re.compile(r'^(A-\d[\w-]*|A\d+WE)$')


def tcds_of(code):
    return next((seg for seg in code.split('_') if TCDS_SEGMENT.match(seg)), '')


def build(t):
    subpart = {r['id']: s(r['code']) for r in t['subpart']}
    subsection = {r['id']: s(r['code']) for r in t['subsection']}

    regs = sorted(t['regulation'], key=lambda r: int(r['id']))
    regulations = [{
        'id': f"reg-{r['id']}",
        'section': s(r['section']),
        'amdt': s(r['amdt']),
        'title': s(r['title']),
        'subpartCode': subpart.get(r['subpart_id'], '-'),
        'subsectionCode': subsection.get(r['subsection_id'], '-'),
        'url': s(r['url']),
        'sort': s(r['sort']),
        'requirementText': r['requirement_text'] or '',
        'defaultMocText': r['default_moc_text'] or '',
        'sectionRoot': s(r['section_root']),
        # Blank means never set; the legacy list reads it as inactive.
        'active': r['active'] == '1',
    } for r in regs]

    subsections = [{
        'id': r['id'], 'code': s(r['code']), 'title': s(r['title']),
        'part23': s(r['part23']), 'part25': s(r['part25']), 'part27': s(r['part27']), 'part29': s(r['part29']),
        'active': r['active'] == '1',
    } for r in sorted(t['subsection'], key=lambda r: int(r['id']))]

    sort_key = {r['id']: (s(r['sort']), int(r['id'])) for r in regs}
    links = {}
    for link in t['certbasis']:
        if link['regulation_id'] in sort_key:
            links.setdefault(link['mastercertbasis_id'], set()).add(link['regulation_id'])

    bases = [{
        'id': f"basis-{m['id']}",
        'aircraftModel': s(m['code']),
        'description': s(m['description']),
        'tcdsNumber': tcds_of(s(m['code'])),
        'regulationIds': [f'reg-{i}' for i in sorted(links.get(m['id'], ()), key=sort_key.get)],
    } for m in sorted(t['mastercertbasis'], key=lambda m: s(m['code']).lower())]

    known = {m['id'] for m in t['mastercertbasis']}
    project_basis = {f"tp-{p['id']}": f"basis-{p['mastercertbasis_id']}"
                     for p in sorted(t['tccaproject'], key=lambda p: int(p['id']))
                     if p['mastercertbasis_id'] in known}
    return regulations, subsections, {'bases': bases, 'projectBasis': project_basis}


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    regulations, subsections, cert_bases = build(read_tables(sys.argv[1]))
    os.makedirs('out/data', exist_ok=True)
    files = {'regulations': regulations, 'subsections': subsections, 'certBases': cert_bases}
    for name, data in files.items():
        text = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        if re.search(r'\b[\w.+-]+@[\w-]+\.[\w.]+\b', text):
            sys.exit(f'{name}: an email address reached the output; stopping.')
        with open(f'out/data/{name}.json', 'w', encoding='utf-8') as f:
            f.write(text)
    links = sum(len(b['regulationIds']) for b in cert_bases['bases'])
    print(f"regulations {len(regulations)} | subsections {len(subsections)} | bases {len(cert_bases['bases'])} "
          f"| basis rules {links} | projects linked {len(cert_bases['projectBasis'])}")


if __name__ == '__main__':
    main()
