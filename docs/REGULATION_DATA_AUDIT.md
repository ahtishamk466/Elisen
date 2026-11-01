# Regulation data audit — 2026-11-01

**Scope.** `public/data/regulations.json` (3,973 records: 1,104 active, 2,869 inactive) and `public/data/certBases.json` (40 bases, 14,308 rule memberships in the 39 non-empty ones, 142 project links). `basis-42 Testing` is empty. 3,958 regulations are in at least one basis and 15 are in none. Read-only: nothing in the repo was edited. All counts come from a script run against the files as committed (git shows no pending change in `public/data/`).

**Rules applied.** Blank amendments (`amdt === ''`) are real legacy records and are never treated as "IR". Everything here is the client's legacy record, so every data change below needs their sign-off. Code-only options that leave stored values untouched are marked as such.

**Method notes.**
- "Canonical section" means the section with a `Sec.` / `Sec` / `Secx.` / `JAR` / `CAR` prefix removed and whitespace and case ignored.
- JAR is a different rule set from 14 CFR, so JAR records are counted separately from "true" spelling duplicates.
- "Orderable" amendment means what the app's `amdtOrder()` can sort: `IR` or `NN-N` with a two-digit part (`src/lib/certBasisLevel.ts`).

---

## Summary

| # | Check | Scale | Severity | Proposed fix | Risk | Client decision? |
|---|---|---|---|---|---|---|
| 1 | Same section, different spelling | 443 canonical sections (1,526 records) have 2+ spellings; 295 sections (897 records) excluding JAR. **189 same-amendment twin pairs** (187 identical title and amendment). Only **2 bases** hold two spellings of one section (basis-19 ×4, basis-36 ×9), but **291 of 295** sections are used under different spellings by different bases. | High | Add a derived section key for grouping (code only). Separately, merge the 189 twins. | Code: low. Merge: medium (IDs referenced by 20+ bases and plan entries) | Yes for the merge |
| 2 | Blank amendments | 68 records, 5 bases (BD-700 CL 57, BD-700 GVFD 57, B747-400 9, ATR-42 1, Viking 1). All inactive. 66 have no requirement text. | Info | No data change. Keep blank, shown as "—" / "No amendment recorded". | Low | Confirm only. Never substitute IR. |
| 3 | Unusual amendment formats | 57 distinct non-standard values on **654 records** (586 non-standard plus 68 blank) in 28 bases cannot be ordered by `amdtOrder()`. | High (affects app logic) | Add an amendment parser (code only). Fix 4 clear typos. Merge variant spellings of the same amendment. | Medium: imports match on `section + amdt` text | Yes for stored values |
| 4 | Inactive rules inside bases | **11,503 of 14,308** memberships (80.4%) and 2,868 of 3,958 distinct used records are inactive. Of those, 180 have an active twin, 545 have an active record at another amendment only, and 2,143 have no active version. | Low (the flag is a legacy field) | No change. Do not swap rules to the "active" version. | High if swapped: it changes the certification basis | Yes |
| 5 | Empty or markup-only text | Requirement text: 2,006 empty plus 1 markup-only (50.5% unusable). Default MOC: 3,407 empty plus 3 markup-only plus 2 `################`. | Low | Treat markup-only as empty (helper, no data edit) or blank the 6 values. | Low | Yes if stored values change |
| 6 | No text but another amendment has text | **324 records** (35 bases, 1,093 memberships) via exact section, 94 more via another spelling. 1,683 empty records have no text at any amendment. | Medium | Never copy text across amendments. Show it as a labelled read-only fallback, or ask the client for the missing text. | High if copied | Yes |
| 7 | Empty, bracketed or placeholder titles | 5 empty, 172 bracketed (127 fully, 45 partly), 29 Reserved/Deleted/Removed placeholders. | Low | Strip brackets for display only. Fill 2 of the 5 empty titles from a sibling. Leave placeholders. | Low | Yes for the 2 fills |
| 8 | Sections duplicated inside a basis | **45 sections in 13 bases** (46 surplus records). Plus 4 cross-spelling duplicates in basis-19 that the Duplicates tab cannot see. Plus 23 exact section+amendment pairs held by two records in the library. | Medium | Send the client the list (Appendix A). Then use "Keep the latest version" per basis. | Medium: some duplicates look intentional; `keepLatest` is unsafe on 2 | Yes |

---

## Cross-cutting observations

1. **Most spelling twins come from one late batch.** Records `reg-5002`–`reg-5270` are 269 records, all active, added after the main import. 187 of them re-create an existing record under the other spelling (same section, same amendment). 58 are new amendments of existing sections, 23 are new sections, and 1 is an exact duplicate (`reg-5016` repeats `reg-1494`, 25.343 at 25-18). 205 of the 269 sit in `basis-43` (CL-600-2B19 A-276). The original `Sec.` twin sits in a median of 21 bases.
2. **The app groups on the exact `section` string.** `duplicateSections`, `pickForLevel` and `keepLatest` in `certBasisLevel.ts` group by `r.section`. The import matches on `section + amdt` text (`certBasisImport.ts:39`). So spelling variants are invisible to the Duplicates tab, the level builder and imports. Amendments that `amdtOrder()` cannot parse are "listed but never picked automatically".
3. **`Active` is not a quality signal.** `docs/DECISIONS.md` records that a blank legacy `active` maps to inactive, and about 2,870 inactive rows are "the client's data". The Regulatory Library only displays and filters on it, and the delete dialog uses it for safe-delete.
4. **`sectionRoot` already unifies most spellings.** For example `Sec. 25.173`, `25.173` and `JAR 25.173` all carry `25.0173`, and `CAR 4b.100` maps to `25.0021`. One outlier is `25.785(h)` with root `25.0785(h)` (see §1). `sectionRoot` is `-` on 391 records (appendices, special conditions, MIL, etc.).
5. **Basis edits ripple to projects.** 142 projects point at 39 bases: Lear 35A (basis-11) has 20, A4N (basis-2) 16, Alpha-Jet (basis-8) 14, CL604-650 (basis-19) 10, BD-700 CL and PC-12 (basis-5, basis-34) 8 each. Any rewrite of `regulationIds` changes those projects' GCP scope.

---

## 1. Same section, different spelling

**Counts.** 2,737 distinct section strings collapse to 2,251 canonical sections. 443 of those are held under 2+ spellings:

| Spelling set | Sections |
|---|---|
| bare + `Sec.` | 250 |
| bare + `JAR` | 147 |
| bare + `JAR` + `Sec.` | 42 |
| bare + `JAR` + `Sec` | 1 |
| bare + `Secx.` | 1 |
| `JAR` + `Sec.` | 1 |
| whitespace only (`23.785(j)` `reg-425` vs `23.785 (j)` `reg-426`) | 1 |

`CAR 4b.x` (29 records, all in basis-22) has no bare twin, so no duplicates arise there.

**Pairs (all cross-spelling combinations of different records):**

| Family pair | Same amdt + same title | Same amdt only | Same title only | Neither |
|---|---:|---:|---:|---:|
| bare ↔ `Sec.`/`Sec`/`Secx.` | **187** | 2 | 333 | 79 |
| bare ↔ `JAR` | 0 | 0 | 490 | 195 |
| `Sec.`/`Sec` ↔ `JAR` | 0 | 0 | 42 | 23 |

"Same title only" pairs are one rule's different amendments split across two spellings. They are not duplicates, but they break version lists.

**The 189 same-amendment twins:**
- 177 have identical requirement text (172 both empty, 5 identical).
- 4 have different non-empty text.
- 8 have text on one side only.
- 179 differ in the Active flag, and the newer twin is the active one.
- 2 differ in title:
  - `reg-3053` "Flightcrew Alerting" vs `reg-5152` "Warning, caution, and advisory lights." (25.1322 at 25-38)
  - `reg-3504` vs `reg-5188` (25.1549 at 25-40)

Examples:

| Legacy record | Twin | Note |
|---|---|---|
| `reg-1354` `Sec. 25.173` 25-7, inactive, in 23 bases | `reg-5007` `25.173` 25-7, active, basis-43 only | |
| `reg-1320` `Sec. 25.125` IR (12 bases) | `reg-5005` `25.125` IR (basis-43) | |
| `reg-1175` `Sec. 25.2` 25-20 | `reg-5002` `25.2` 25-20 | |
| `reg-1201` `25.25` 25-23 (9 bases) | `reg-5003` `Sec. 25.25` 25-23 | The reverse direction; in no basis. |
| `reg-3926` `Sec. C25.1` IR | `reg-3923` `C25.1` IR | Appendix C |
| `reg-3871` `Sec. A25` 25-## | `reg-3872` `A25` IR | Appendix A |

**Bases that hold two spellings of one section:**
- **basis-19 CL604-650** has 4 sections:
  - 25.963: `reg-2623` at 25-69 and `Sec.` `reg-2626` at IR
  - 25.965: `Sec.` `reg-2629` at 25-11 and `reg-2630` at 25-40
  - 25.994: `reg-2678` and `reg-2679`
  - 25.997: `reg-2687` and `reg-2688`
- **basis-36 Falcon-900EX** has 9 sections mixing bare, `Sec.` and `JAR`:
  - 25.1303: `reg-2946` bare at 25-38 and `reg-2948` `JAR` at Change 13
  - 25.1305: `reg-2960` and `reg-2962`
  - 25.1309: `reg-3029` and `reg-3033`
  - 25.1322: `reg-3053` and `reg-3056`
  - 25.1323: `reg-3060` and `reg-3063`
  - 25.1329: `reg-3076` and `reg-3077`
  - 25.1331: `reg-3084` and `reg-3085`
  - 25.1333: `reg-3093` and `reg-3094`
  - 25.1335: `reg-3096` and `reg-3097`

**Bases holding both members of a same-amendment twin: 0.** Each base is on one "cohort": 25 bases use `Sec.` records, the rest use bare. The split is across bases, so any cross-basis question such as "which bases include 25.173?" returns a partial answer unless it uses `sectionRoot` or a canonical key. 291 of 295 non-JAR multi-spelling sections are used under 2+ spellings by different bases.

**Other spelling anomalies:** `reg-5096` `Sec 25.815` (no dot) and `reg-5172` `Secx. 25.1445` (typo). `reg-426` `23.785 (j)` has a space. `ICAO Annex 16  Vol. I (Noise)` has a double space. `25.785(h)` has an odd `sectionRoot` of `25.0785(h)`. `AWM 525.x` has 71 records, 35 of which share a section string with a bare `525.x` record. That looks like a different document, but it is worth asking the client.

**JAR.** 352 records, used in 6 bases: Falcon7X 147, Falcon2000EX 142, ATR-42 112, Falcon-900EX 19, BD-700 CL 1, BD-700 GVFD 1. JAR is a separate rule set (Change 13–16, not FAR amendments), so leave it as is and relate it through `sectionRoot`.

**Fix.**
- **A (code only, recommended first).** Derive a `sectionKey` (prefix and whitespace stripped, JAR and CAR kept distinct) for the Duplicates tab, level builder and import matching. No stored value changes.
- **B (data).** Merge the 189 twins. Pick a survivor per pair (bare is the majority convention, 3,260 of 3,973), repoint the bases that hold the other member, then retire it. The store already refuses to delete referenced records.
- **C (data).** Fix the typos `Sec 25.815`, `Secx. 25.1445` and `23.785 (j)`.

**Risk.** A is low. B is medium: `basis-43` holds 184 of the newer twins, the older twins sit in up to 23 bases, and 4 pairs have conflicting text. **Client decision:** yes for B and C. Also ask whether `AWM 525.x`, `ESF 25.x` and `JAR 25.x` should be linked to their FAR or CAR counterparts or stay separate.

---

## 2. Blank amendments (`amdt ''`)

- **68 records**, all inactive, all bare section strings.
- **66 have no requirement text**, none has MOC text, and only `reg-4171` and `reg-4216` have requirement text.
- By subpart: K (57, Part 525 rows such as `525.601` and `525.1309(a)`) and SC (11).
- **Bases:**

| Basis | Blank records |
|---|---:|
| BD-700_A-177_CL (basis-5) | 57 (of 657) |
| BD-700_A-177_GVFD (basis-21) | 57 (of 645) |
| B747-400_A20WE (basis-7) | 9 (SC 25-285-SC, 25-61-NW-1, 25-71-NW-3 and revised, 25-77-NW-4, 25-ANM-16/16A/24/25) |
| 1679-ATR-42 (basis-10) | 1 (`reg-4171` EASA CRI-H01) |
| Viking_DHC-6_A-82 (basis-17) | 1 (`reg-4216` SFAR 23 para 57) |

- Only 2 have a same-section sibling:
  - `reg-3735` `525.951(d)` has sibling `reg-3738` at "Change 525-3".
  - `reg-3810` `525.1581(a)(3)` has sibling `reg-3811` at "525-3".
  - Both of these blank rows also have empty titles. No basis holds a blank row together with a sibling of the same section.

**Fix.** None to the data. They display as "—", with "No amendment recorded" on hover and for screen readers (`AmendmentText`, 2026-11-01 entry), and link only to exact existing records. Optionally ask the client whether the 57 Part 525 rows have a known amendment. We must not infer one from siblings. **Risk:** low if left alone. Writing "IR" would silently change the certification basis. **Client decision:** confirm only.

---

## 3. Unusual amendment formats

233 distinct values: 176 standard (`IR` plus 175 values of the form `23-N` / `25-N`, 3,319 records) and **57 non-standard on 654 records**:

| Format | Distinct | Records | Bases | Values and examples |
|---|---:|---:|---:|---|
| Blank | 1 | 68 | 5 | see §2 |
| JAR `Change N` | 4 | 351 | 4 | Change 15 ×139, Change 14 ×131, Change 13 ×73, Change 16 ×8 (all `JAR 25.x`, e.g. `reg-1170`) |
| Text dates | 8 | 68 | 4 | `15 DEC 04` ×47, `13 JUN 2005` ×12, `28 NOV 94` ×4, `24 AUG 98`, `30 AUG 94`, `28-Sep-95`, `10-Nov-95`, `29 October 1991` (`reg-4170` SCA 91-7) |
| ISO dates | 5 | 14 | 2 | `2009-12-01` ×10 (`551.104(a)–(c)`, A4N), `2009-03-12`, `1991-12-10`, `1992-05-11`, `1994-01-11` (`reg-5204`–`5207`, CRJ) |
| Canadian 52x numbering | 19 | 67 | 16 | bare `525-3` ×10, `525-1` ×9, `525-8` ×7, `525-2` ×2, `525-4`, `525-6` ×2, `523-8`, `523-18`; `Change 525-5` ×11, `Change 525-X` ×10, `Change 525-3` ×4, `Change 525-2` ×2, `Change 525-8/-9/-11/-14/-22`, `Change 516-15`; `525-3 (91-11-01)` (`reg-3804`) |
| `CH 1` / `CH1` | 2 | 4 | 2 | `reg-3671`, `reg-3677` (CH 1); `reg-3672`, `reg-3676` (CH1) |
| Edition / issue / stage | 6 | 18 | 14 | `First Edition` ×13, `Issue 0/1/4`, `Stage 2`, `C` (`reg-4027`) |
| Placeholders | 4 | 56 | 6 | `-` ×45 (AWO, ESF, FAR 34/36), `N/A` ×8 (ICAO Annex 16, `reg-1382`), `TBD` ×1 (`reg-4153`), `25-##` ×2 (`reg-3871`, `reg-3919`) |
| Malformed FAA | 4 | 4 | 2 | `25-IR` (`reg-3030`, 25.1309), `25-42X` (`reg-5004`), `25-56X` (`reg-5098`), `25-41X` (`reg-5169`) |
| CAR `4b-N` | 4 | 4 | 1 | `4b-1`, `4b-3`, `4b-6`, `4b-12` (basis-22) |

**Impact.**
- None of these can be ordered, so they are excluded from "latest" selection.
- The same amendment is spelled several ways (`525-3` / `Change 525-3` / `525-3 (91-11-01)`, `CH 1` / `CH1`).
- Three different values mean "no amendment" (`-`, `N/A`, blank) alongside `IR`.
- In `basis-16`, `keepLatest` on `JAR 25.1423` (Change 13 vs Change 14, both unorderable) ties and keeps whichever is first, so it can drop the newer Change 14.

**Fix.**
- **Code only.** Add one amendment parser that classifies each value, gives it an order where one is knowable (Change N, 525-N), and flags the rest as "unordered" instead of guessing.
- **Data, client approval needed.** Correct the 4 malformed values, unify the variants of the same amendment, and decide how `-` / `N/A` / `TBD` should read.
- **Risk.** Rewriting values is medium risk: `sort` keys embed the amendment (e.g. `25.0002_CH14`), and `certBasisImport` matches legacy spreadsheets on exact `section + amdt` text. **Client decision:** yes for any stored change.

---

## 4. Inactive rules inside bases

Overall, 11,503 of 14,308 basis memberships are inactive (80.4%), and 29 of 39 bases are at least 80% inactive. Highest: basis-18 Falcon7X 100% (147 of 147), basis-22 Hawker 97%, basis-40 737-200 93%, basis-11 Lear 35A 93%. Lowest: basis-44 ERJ 6%, basis-45 CL-600-2B16 12%, basis-27 PA-28-181 27%, basis-6 TIA 38%, basis-31 Beech C90A 39%, basis-43 CRJ 39%.

For the inactive memberships, "active version available" means another active record of the same canonical section, same family:

| Inactive memberships | Count |
|---|---:|
| Active twin at the same amendment (`Sec.` ↔ bare) | 3,451 |
| Active record at a different amendment only | 1,453 |
| No active version | 6,599 |
| **Total** | **11,503** |

At distinct-record level: 2,868 inactive records, 180 with an active twin, 545 with an active record at another amendment only, 2,143 with none. Per-basis counts are in the scorecard (columns "Inactive", "Inactive, active twin", "Inactive, other amdt active").

Per basis, the active twin is almost entirely the §1 batch: 108–180 inactive rules per `Sec.`-cohort basis (A320 177, CL-600to3R 180, DHC-8 179, Falcon-900EX 179). Bases with no `Sec.` rules (1900D, A4N, Alpha-Jet, B300, PC-12, Viking, TIA) have 0.

**Fix.** Do not change flags and do not swap rules to the "active" version. An active record at another amendment means a different certification basis, so replacing it is a regulatory change. The 180 inactive-with-active-twin cases are resolved by the §1 merge, not by a flag change. If the client wants a meaningful "current" notion, define it first. Mass-activating 2,868 records is possible but changes the Active badge in the library for most of the dataset. **Risk:** low if untouched, high if swapped. **Client decision:** yes. Ask what "Active" is meant to mean.

---

## 5. Empty or markup-only text

| Field | Empty string | Markup-only | Real text |
|---|---:|---:|---:|
| `requirementText` | 2,006 | 1 | 1,966 |
| `defaultMocText` | 3,407 | 3 | 563 |

- **Markup-only:**
  - `reg-2863` 25.1182 at 25-11, requirement `<p>&nbsp;&nbsp;</p>`, in basis-43 and basis-9.
  - `reg-2175` (25.785), `reg-2193` (25.787) and `reg-3029` (25.1309 at 25-41), default MOC `<p>&nbsp;</p><p>&nbsp;</p>`. Together with `reg-2863` they appear in 18 bases.
- **Placeholder text:** `reg-1012` and `reg-1013` (23.1435(b), (c) at 23-14, in basis-8) have default MOC `################`. `reg-3186` (`JAR 25.1357(f)`) has requirement text "(f) Reserved". Short default MOC strings such as "Noted" appear 10 times.
- 2,007 of 3,973 records (50.5%) have no usable requirement text; 2,006 of those are in a basis. The shared Regulation text view already tolerates this and shows an explicit "missing text" note.

**Fix.** Preferred: a single `hasText()` helper in code that strips tags, `&nbsp;` and escaped newlines before testing, so the 4 markup-only values behave as empty with no data edit. Alternative: blank the 4 values and ask what the 2 `####` rows should say. **Risk:** low. **Client decision:** yes only if stored values are changed.

---

## 6. No requirement text, but another amendment of the same section has text

- **324 records** have empty text while another record with the *same exact section string* has text. All 324 are in bases, spread over 35 bases and 1,093 memberships.
- Another **94** only match through a different spelling (66 within the non-JAR family), so 418 in total.
- In **25 sections inside a single basis**, the basis holds both an empty and a text version, e.g. basis-41 `25.561` (`reg-1738` at 25-91 empty, `reg-1739` at IR), `25.607`, `25.1309`.
- Direction of the text: on an older amendment only for 193 records, a newer one only for 84, mixed or unorderable for 47. 6 of the 324 are Reserved/Deleted/Removed rows, where empty is expected.
- Examples:
  - `reg-31` 23.45 at 23-34 has no text, `reg-30` at 23-21 has text.
  - `reg-37` 23.49 at 23-7 has no text, `reg-35` and `reg-36` have text.
  - `reg-63` 23.75 at 23-34 has no text, `reg-62`, `reg-64` and `reg-65` have text.
- The pattern is that text was entered once per section, usually on the oldest row (23-21, IR).
- 1,683 empty records belong to sections with no text at any amendment (1,207 of 2,737 sections). Sibling text cannot help them; the source text is simply not in the legacy data.

**Fix.** Do not copy text across amendments: the wording can differ between amendments and the text is legal content. Options: (a) code-only fallback on the rule view, "No text recorded for this amendment. Text recorded for 23-21:" in a clearly labelled read-only block; (b) ask the client to supply or confirm text for the 324. **Risk:** high if copied (wrong legal text under a rule), low for the fallback. **Client decision:** yes.

---

## 7. Empty, bracketed and placeholder titles

- **Empty titles: 5**, all in bases: `reg-3735` `525.951(d)` and `reg-3810` `525.1581(a)(3)` (both blank-amendment, basis-5 and basis-21), `reg-3881` `AWO 207(a)`, `reg-3882` `AWO 207(b)`, `reg-4195` `SCA 23-ACE-48A` (basis-30).
  - `reg-3735` and `reg-3810` have siblings with titles ("Fuel System -General" on `reg-3738`, "Aeroplane Flight Manual, Noise" on `reg-3811`).
  - The other 3 have no sibling to copy from.
- **Bracketed titles: 172** (157 sections, 168 in bases, 38 bases):
  - 127 fully bracketed, e.g. `reg-1811` "[Fasteners.]" (25.607 at 25-23), `reg-6` "[Special retroactive requirements.]", `reg-3029` "[Equipment, systems, and installations.]" ×13 versions.
  - 45 partly bracketed, e.g. `reg-280` "Design and construction principles - [Fasteners.]", `reg-4001` "Emergency [Evacuation]".
  - In 38 cases the same section has an unbracketed sibling with the same words.
  - The brackets are the source text's own convention for text revised or added in that amendment. They carry meaning, but they read as noise in titles.
- **Placeholder titles: 29**, all in bases (26 bases): "Deleted." ×12, "Removed." ×8, "[Deleted.]" ×3, "Reserved." ×3, "[Reserved.]" ×2, "[ Removed ]" ×1. 17 of them have a sibling with a real title. These are genuine "section withdrawn at this amendment" rows, e.g. `reg-1222` 25.45 at 25-38, `reg-1781` 25.573 at 25-45.
- 2 titles end with `..` (e.g. "General..").

**Fix.**
- Strip a leading and trailing `[ ]` for display only, keeping the raw value on hover or in export.
- Fill the 2 empty titles from their siblings, with client approval. The other 3 need the client.
- Leave Reserved/Deleted/Removed rows in the bases; optionally tag them "Withdrawn at this amendment".

**Risk:** low. **Client decision:** yes for the title fills.

---

## 8. Sections duplicated inside a basis

- **13 bases, 45 sections, 46 surplus records.** 44 sections have 2 versions and 1 has 3. By amendment kind: 27 NN-N + NN-N, 16 IR + NN-N, 1 three-way (basis-41 25.1309: 25-123, 25-41, `25-IR`), 1 JAR Change 13 + 14.
- The `Duplicates` tab and "Keep the latest version" cover exact-section duplicates. They do not catch cross-spelling duplicates: 4 extra in basis-19 (§1), so 49 canonical duplicates in all.

| Basis | Dup. sections | Examples |
|---|---:|---|
| basis-27 PA-28-181 | 17 | 23.994 (`reg-610` 23-29 / `reg-611` 23-7), 23.1011, 23.1111 … Part 23, original 23-7/IR plus later amendments |
| basis-41 B737-8 | 5 | 25.561, 25.607, 25.783, 25.807, 25.1309 |
| basis-5 BD-700 CL | 5 | 25.119, 25.613(a)(b), (c), (d), (e) |
| basis-19 CL604-650 | 5 | 25.613(a)(b), (c), (e), 25.811(b), 25.853(c) |
| basis-21 BD-700 GVFD | 3 | 25.111(e), 25.119, 25.1353(a) |
| basis-11 Lear 35A | 3 | 25.177, 25.181, 25.205 |
| 8 others | 1 each | basis-39 25.305, basis-43 25.773, basis-32 `Sec. 25.685`, basis-33 25.561, basis-1 25.853, basis-16 `JAR 25.1423`, basis-26 25.119 |

Appendix A lists all 45.

- **Library level.** 23 section+amendment pairs are held by two different records each (46 records), against the app's documented one-record-per-section-and-amendment rule:
  - 17 Part 23 appendix rows `A23.x`–`G23.x`: `reg-3856`… duplicated as `reg-4196`–`reg-4212`, the copies all in basis-24 Beech-B300.
  - `reg-1494` / `reg-5016` (25.343 at 25-18).
  - `reg-1739` / `reg-1742` (25.561 at IR) and `reg-1812` / `reg-1815` (25.607 at IR). These have different titles and may be two sub-paragraphs.
  - `reg-3031` / `reg-3033` (JAR 25.1309, Change 14).
  - `reg-3715` / `reg-3842` and `reg-3720` / `reg-3844` (AWM 525.697(b) and 525.699(d), First Edition).

**Fix.** Do not trim automatically. A basis can legitimately cite the same section at two levels, for example "25.613 at 25-72 except (c)–(e) at 25-112", so the client must mark each one as keep-both or keep-one. After that, use the existing "Keep the latest version" per basis. `keepLatest` is unreliable on `basis-41` 25.1309 (`25-IR` unorderable) and `basis-16` `JAR 25.1423` (tie). Treat those two by hand. The 23 library pairs are cleaned by the §1 merge process. **Risk:** medium; trimming changes the certification basis of the 13 bases (basis-27 is used by 1 project, basis-5 by 8, basis-19 by 10). **Client decision:** yes.

---

## Per-basis scorecard

Columns: **Inactive, active twin** and **Inactive, other amdt active** are §4. **Odd amdt** excludes blank. **No text, sibling has** counts rules with no requirement text where another amendment of the same exact section has text. **Mixed spellings** is the number of canonical sections held under 2+ spellings in the basis. **Bracketed/empty title** counts memberships.

| Basis | Model | Rules | Inactive | Inactive, active twin | Inactive, other amdt active | Blank amdt | Odd amdt | No req. text | No text, sibling has | Dup. sections | Mixed spellings | Bracketed/empty title |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| basis-6 | 1617_TIA | 26 | 10 | 0 | 2 | 0 | 0 | 1 | 1 | 0 | 0 | 6 |
| basis-10 | 1679-ATR-42 | 115 | 85 | 0 | 5 | 1 | 114 | 1 | 1 | 0 | 0 | 3 |
| basis-30 | 1900D_A-149 | 362 | 291 | 0 | 41 | 0 | 2 | 263 | 61 | 0 | 0 | 24 |
| basis-40 | 737-200_A16WE | 353 | 329 | 115 | 85 | 0 | 0 | 243 | 6 | 0 | 0 | 1 |
| basis-14 | A320_A-166 | 434 | 368 | 177 | 23 | 0 | 1 | 327 | 30 | 0 | 0 | 17 |
| basis-2 | A4N_23-14 | 402 | 339 | 0 | 54 | 0 | 11 | 227 | 53 | 0 | 0 | 31 |
| basis-8 | Alpha-Jet_23-23 | 435 | 371 | 0 | 50 | 0 | 1 | 228 | 48 | 0 | 0 | 33 |
| basis-9 | Astra_A-202 | 425 | 360 | 169 | 20 | 0 | 18 | 345 | 33 | 0 | 0 | 20 |
| basis-23 | B737-500_A-146 | 392 | 353 | 127 | 81 | 0 | 4 | 289 | 24 | 0 | 0 | 11 |
| basis-41 | B737-8_A-146 | 412 | 342 | 91 | 71 | 0 | 23 | 338 | 53 | 5 | 0 | 11 |
| basis-7 | B747-400_A20WE | 408 | 357 | 172 | 14 | 9 | 0 | 338 | 27 | 0 | 0 | 8 |
| basis-20 | BD-100_A-234 | 456 | 388 | 128 | 68 | 0 | 9 | 375 | 50 | 0 | 0 | 35 |
| basis-39 | BD-700-1A11_A-177 | 425 | 364 | 150 | 42 | 0 | 11 | 353 | 38 | 1 | 0 | 12 |
| basis-5 | BD-700_A-177_CL | 657 | 561 | 131 | 69 | 57 | 129 | 537 | 44 | 5 | 0 | 46 |
| basis-21 | BD-700_A-177_GVFD | 645 | 568 | 129 | 67 | 57 | 129 | 531 | 44 | 3 | 0 | 40 |
| basis-24 | Beech-B300_A-149 | 362 | 288 | 0 | 40 | 0 | 2 | 258 | 59 | 0 | 0 | 26 |
| basis-31 | Beech_C90A_A-23-TBD-3193 | 18 | 7 | 0 | 5 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| basis-28 | Cessna_750-0500_A-173 | 431 | 366 | 150 | 38 | 0 | 12 | 357 | 41 | 0 | 0 | 13 |
| basis-45 | CL-600-2B16_SA25-67_3284 | 43 | 5 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 8 |
| basis-43 | CL-600-2B19_A-276 | 431 | 169 | 0 | 11 | 0 | 16 | 351 | 45 | 1 | 0 | 10 |
| basis-32 | CL-600to3R_A-131 | 393 | 353 | 180 | 22 | 0 | 2 | 304 | 4 | 1 | 0 | 6 |
| basis-19 | CL604-650_A-131 | 528 | 390 | 151 | 42 | 0 | 8 | 356 | 30 | 5 | 4 | 33 |
| basis-29 | DHC-8-1XX_A-142 | 447 | 384 | 179 | 26 | 0 | 2 | 326 | 28 | 0 | 0 | 12 |
| basis-33 | DHC-8-2XX_A-142 | 460 | 393 | 179 | 34 | 0 | 0 | 342 | 33 | 1 | 0 | 9 |
| basis-1 | DHC-8-3XX_A-142 | 431 | 370 | 177 | 29 | 0 | 0 | 320 | 32 | 1 | 0 | 15 |
| basis-25 | DHC-8-400_A-142 | 477 | 398 | 140 | 65 | 0 | 12 | 363 | 40 | 0 | 0 | 37 |
| basis-44 | ERJ 170-190_A-25-0140 | 17 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| basis-36 | Falcon-900EX_A-136 | 442 | 370 | 179 | 17 | 0 | 31 | 357 | 33 | 0 | 9 | 11 |
| basis-16 | Falcon2000EX_A-249 | 143 | 98 | 0 | 0 | 0 | 143 | 1 | 1 | 1 | 0 | 2 |
| basis-3 | Falcon50EX_A-136 | 412 | 370 | 169 | 40 | 0 | 0 | 297 | 10 | 0 | 0 | 11 |
| basis-18 | Falcon7X_A-251 | 147 | 147 | 0 | 27 | 0 | 147 | 5 | 2 | 0 | 0 | 3 |
| basis-26 | GV-SP_A-129 | 442 | 374 | 131 | 63 | 0 | 3 | 369 | 48 | 1 | 0 | 32 |
| basis-22 | Hawker_850XP_A-145 | 31 | 30 | 1 | 0 | 0 | 4 | 1 | 0 | 0 | 0 | 1 |
| basis-12 | IAI_1124 | 396 | 357 | 168 | 38 | 0 | 0 | 277 | 9 | 0 | 0 | 10 |
| basis-38 | Lear-45_A-214 | 430 | 368 | 149 | 45 | 0 | 11 | 351 | 38 | 0 | 0 | 14 |
| basis-11 | Lear_35A_A-128 | 427 | 399 | 109 | 115 | 0 | 0 | 234 | 5 | 3 | 0 | 1 |
| basis-27 | PA-28-181_A-21-0186 | 703 | 191 | 0 | 19 | 0 | 1 | 143 | 27 | 17 | 0 | 46 |
| basis-34 | PC-12-47E_A-201 | 416 | 317 | 0 | 39 | 0 | 0 | 264 | 45 | 0 | 0 | 20 |
| basis-17 | Viking_DHC-6_A-82 | 334 | 272 | 0 | 43 | 1 | 1 | 214 | 50 | 0 | 0 | 24 |
| **Total** | 39 non-empty bases | **14,308** | **11,503** | **3,451** | **1,453** | **125** | **847** | **9,887** | **1,093** | **45** | **13** | **643** |

---

## Suggested order and questions for the client

1. **Safe, code-only (confirm, no data touched):** a derived section key, an amendment parser that marks unorderable values explicitly, an `hasText()` helper for markup-only values, display-only bracket stripping, and a labelled text fallback from another amendment.
2. **Sign-off needed before any stored change:**
   - Merge the 189 spelling twins, and which spelling is the survivor.
   - Whether `AWM 525.x`, `ESF 25.x` and `JAR 25.x` should link to their FAR counterparts.
   - The meaning of "Active", and confirmation that we must not swap inactive rules for active ones.
   - Amendment variants: unify `525-N` / `Change 525-N` / `CH1`, fix `25-IR`, `25-41X`/`42X`/`56X`, `25-##`, and what `-`, `N/A` and `TBD` mean.
   - Text for the 324 empty rules, or approval of the fallback display.
   - A keep-both or keep-one verdict for each of the 45 in-basis duplicate sections (Appendix A).
   - Titles for `AWO 207(a)`, `AWO 207(b)`, `SCA 23-ACE-48A`, and the 2 `################` MOC values.
3. **Do not do:** change blank amendments to IR, copy requirement text between amendments, switch a basis rule to a different amendment, or mass-flip Active.

---

## Appendix A — the 45 duplicated sections (record@amendment, `*` = active)

- **basis-41 B737-8:** 25.561 `reg-1738`@25-91* / `reg-1739`@IR · 25.607 `reg-1811`@25-23* / `reg-1812`@IR · 25.783 `reg-2114`@25-114 / `reg-2120`@25-72 · 25.807 `reg-2250`@25-114 / `reg-2257`@25-72 · 25.1309 `reg-3028`@25-123 / `reg-3029`@25-41* / `reg-3030`@25-IR
- **basis-39 BD-700-1A11:** 25.305 `reg-1438`@25-86* / `reg-1437`@25-77*
- **basis-5 BD-700 CL:** 25.119 `reg-1306`@25-94 / `reg-1305`@25-84 · 25.613(a)(b) `reg-1828`@25-112* / `reg-1830`@25-72* · 25.613(c) `reg-1834`@25-112* / `reg-1836`@25-72 · 25.613(d) `reg-1840`@25-112* / `reg-1842`@25-72 · 25.613(e) `reg-1846`@25-112* / `reg-1848`@25-72
- **basis-21 BD-700 GVFD:** 25.111(e) `reg-1284`@25-115 / `reg-1285`@25-94 · 25.119 `reg-1306`@25-94 / `reg-1305`@25-84 · 25.1353(a) `reg-3133`@25-113 / `reg-3134`@25-42*
- **basis-43 CL-600-2B19:** 25.773 `reg-2082`@25-72* / `reg-2081`@25-46
- **basis-32 CL-600to3R:** `Sec. 25.685` `reg-1946`@25-38 / `reg-1949`@IR
- **basis-19 CL604-650:** 25.613(a)(b) `reg-1828` / `reg-1830` · 25.613(c) `reg-1834` / `reg-1836` · 25.613(e) `reg-1846` / `reg-1848` · 25.811(b) `reg-2272`@25-46 / `reg-5246`@25-32* · 25.853(c) `reg-2427`@25-59 / `reg-2425`@25-32*
- **basis-33 DHC-8-2XX:** 25.561 `reg-1737`@25-64* / `reg-5058`@25-23*
- **basis-1 DHC-8-3XX:** 25.853 `reg-2460`@25-66 / `reg-2458`@25-59
- **basis-16 Falcon2000EX:** `JAR 25.1423` `reg-5216`@Change 13* / `reg-5232`@Change 14* (keepLatest tie)
- **basis-26 GV-SP:** 25.119 `reg-1306`@25-94 / `reg-1305`@25-84
- **basis-11 Lear 35A:** 25.177 `reg-1361`@25-72 / `reg-1362`@IR · 25.181 `reg-1366` / `reg-1367` · 25.205 `reg-1378`@25-72 / `reg-1379`@IR
- **basis-27 PA-28-181:** 23.994 `reg-610`@23-29* / `reg-611`@23-7 · 23.997 `reg-4358`@23-43* / `reg-619`@23-7 · 23.1001 `reg-4361`@23-51* / `reg-622`@23-7 · 23.1011 `reg-4362`@23-43* / `reg-623`@IR · 23.1013 `reg-4363`@23-51* / `reg-625`@IR · 23.1015 `reg-626`@23-15* / `reg-627`@IR · 23.1017 `reg-628`@23-14* / `reg-629`@23-7 · 23.1019 `reg-4364`@23-43* / `reg-633`@IR · 23.1021 `reg-4365`@23-43* / `reg-635`@IR · 23.1027 `reg-4366`@23-43* / `reg-638`@IR · 23.1061 `reg-4372`@23-43* / `reg-652`@IR · 23.1101 `reg-4378`@23-43* / `reg-663`@IR · 23.1111 `reg-667`@23-17* / `reg-668`@23-7 · 23.1121 `reg-4393`@23-51* / `reg-670`@23-7 · 23.1123 `reg-4394`@23-43* / `reg-671`@IR · 23.1125 `reg-672`@23-17* / `reg-673`@IR · 23.1147 `reg-4405`@23-43* / `reg-695`@23-7

Note: in basis-5, basis-19 and basis-21 the same pairs recur across bases (e.g. 25.119 in three bases, 25.613 in two), so the 45 sections reduce to 40 distinct record sets for the client to review.