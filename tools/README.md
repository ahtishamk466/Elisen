# Importing the client's TPMS database

Turns a `pmtts_*.sql.gz` mysqldump into the app's fixtures and `public/data/`.
Run the three steps in order from a scratch directory:

```bash
python3 1-split-dump.py      # .sql.gz  -> tbl/<table>.sql   (relevant tables only)
python3 2-parse-tables.py    # tbl/*.sql -> json/<table>.json (typed rows)
python3 3-build-fixtures.py  # json/*   -> out/*.ts + out/data/*.json
```

Then copy `out/*.ts` into `src/lib/` and `out/data/*.json` into `public/data/`.
Set `SRC` at the top of `1-split-dump.py` to the dump's path first.

## What is and is not imported

Business records — projects, work packages, activities, approvals,
deliverables, design data, TCCA projects, aircraft, ATA chapters, companies,
settings, RBAC structure — are carried over **verbatim**.

Three things are deliberately dropped or replaced, because this prototype is
served publicly with no backend, so anything imported here is public:

| Source | Treatment |
|---|---|
| `user.password_hash`, `auth_key`, `password_reset_token` | **never read** |
| `userprofile.hourly_rate`, banked hours, `hoursworked.hourly_rate` | **never read** |
| Every person's name, email, phone (staff, contacts, aircraft owners) | replaced with a stable stand-in |
| Free-text comments and next-action notes | scanned for real names and emails, which are swapped for the same stand-ins |

Stand-ins are deterministic: the same real person always maps to the same
stand-in, so counts and relationships are unchanged and a re-run is
byte-identical. `3-build-fixtures.py` prints what it scrubbed.

Verify after a re-run — none of these should appear in `out/`:
real full names, real email addresses, password hashes, or hourly rates.
