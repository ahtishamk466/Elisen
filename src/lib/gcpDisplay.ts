import type { Subpart, Subsection } from '@/types/gcp'

/** Abbreviations the client's data carries in capitals; title casing must not
    turn APU into Apu. Everything else that arrives SHOUTING is lowered. */
const ACRONYMS = new Set([
  'AWM', 'FAR', 'ICAO', 'JAA', 'APU', 'EWIS', 'SFAR', 'ATC', 'ATCS', 'TBD',
  'EX', 'ES', 'SC', 'EMC', 'IFE', 'DAO', 'TCCA', 'FAA', 'EASA',
])

const SMALL_WORDS = new Set(['and', 'or', 'of', 'the', 'a', 'an', 'to', 'for', 'in', 'on', 'as', 'at', 'by', 'that', 'this'])

const casePart = (part: string, first: boolean) => {
  const bare = part.replace(/[^A-Za-z0-9/]/g, '')
  if (!bare || /\d/.test(bare) || bare.length === 1) return part
  if (ACRONYMS.has(bare.toUpperCase()) && part === part.toUpperCase()) return part
  /* Only words the client stores in capitals are recased — anything already
     written in sentence case is theirs and stays as typed. */
  if (part !== part.toUpperCase()) return part
  const lower = part.toLowerCase()
  if (!first && SMALL_WORDS.has(lower)) return lower
  return lower.replace(/^[a-z]/, (c) => c.toUpperCase())
}

/**
 * The client's subpart and subsection names as Title Case — `ELECTRICAL WIRING
 * INTERCONNECTION SYSTEMS (EWIS)` reads as `Electrical Wiring Interconnection
 * Systems (EWIS)`.
 *
 * Display only: the stored value is untouched, so an export that arrives in
 * capitals still round-trips unchanged.
 */
export function titleCaseName(name: string) {
  let wordIndex = 0
  return name.split(/(\s+)/).map((token) => {
    if (/^\s+$/.test(token)) return token
    const isFirst = wordIndex === 0
    wordIndex += 1
    /* Hyphenated words case each half: NON-CIVIL -> Non-Civil. */
    return token.split('-').map((part, i) => casePart(part, isFirst && i === 0)).join('-')
  }).join('')
}

/** `A -- GENERAL`, the way the legacy dropdown reads — for pickers and filter
    chips, where the two halves have to travel as one string. */
export function subpartLabel(code: string, subparts: Subpart[]) {
  const s = subparts.find((x) => x.code === code)
  return s ? `${s.code} -- ${titleCaseName(s.description)}` : code
}

export function subsectionLabel(code: string, subsections: Subsection[]) {
  const s = subsections.find((x) => x.code === code)
  return s ? `${s.code} -- ${titleCaseName(s.title)}` : code
}

/**
 * The same pair split for a table cell, where the code is a chip and the name
 * sits beside it. A name the legacy data stores as a placeholder (`--`, or the
 * code repeated) is dropped: an empty chip reads better than a row of dashes.
 */
export function subpartParts(code: string, subparts: Subpart[]) {
  const s = subparts.find((x) => x.code === code)
  return { code, name: realName(s?.description, code) }
}

export function subsectionParts(code: string, subsections: Subsection[]) {
  const s = subsections.find((x) => x.code === code)
  return { code, name: realName(s?.title, code) }
}

/** `A — GENERAL` for a place that needs the pair as one string (the View
    drawer, a screen-reader label). Bare code where there is no real name. */
export function codeName({ code, name }: { code: string; name: string }) {
  return name ? `${code} — ${name}` : code
}

/** First `max` words, with an ellipsis where the rest was. Word-based rather
    than character-based so a name is never cut mid-word. */
export function capWords(text: string, max: number) {
  const words = text.trim().split(/\s+/)
  return words.length <= max ? text.trim() : `${words.slice(0, max).join(' ')}…`
}

/** The subpart a subsection belongs to — its code with the trailing digits
    stripped (B04 -> B, C14 -> C). Derived, not stored: the legacy data has no
    explicit link, but every subsection code carries its subpart's letters as a
    prefix, verified against every row in the fixtures. */
export function subpartCodeOfSubsection(subsectionCode: string) {
  return subsectionCode.replace(/\d+$/, '')
}

function realName(name: string | undefined, code: string) {
  const t = (name ?? '').trim()
  if (!t || /^-+$/.test(t) || t === code) return ''
  return titleCaseName(t)
}

/**
 * What the Source column calls a rule's link. The FAA's own site is named,
 * since that is where nearly every rule text lives and saying so tells the
 * reader what opens before they click.
 */
export function sourceLabel(url: string) {
  if (!url.trim()) return 'No source'
  return /(^|\.)faa\.gov/i.test(hostOf(url)) ? 'FAA Source' : 'Source'
}

function hostOf(url: string) {
  try {
    return new URL(url.trim()).hostname
  } catch {
    return ''
  }
}

/**
 * A code as it fits a round two-character initials disc (`Avatar`'s own
 * pattern: `bg-accent-subtle` circle, accent initials) — every subpart code
 * is one letter except a handful (`AWO`, `APP`…) that ran three, which
 * stretched the fixed-size circle into a pill. Capped at 2, matching every
 * other code in the set instead of one outlier breaking the shape.
 */
export function initialsOf(code: string) {
  return code.slice(0, 2)
}
