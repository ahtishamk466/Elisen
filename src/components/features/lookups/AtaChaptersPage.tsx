import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { StatCard } from '@/components/patterns/StatCard'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Truncate } from '@/components/patterns/Truncate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { AtaChapterDrawer } from './AtaChapterDrawer'
import { AtaSubChapterDrawer } from './AtaSubChapterDrawer'
import { useLookupStore } from '@/stores/lookupStore'
import { useDocumentsStore } from '@/stores/documentsStore'
import type { AtaChapter, AtaSubChapter } from '@/types/lookup'

export type PageState = 'ready' | 'loading' | 'error'

const SUB_CHAPTER_HEADERS = ['Code', 'Title', 'Definition', 'Active', 'Actions']

/**
 * The two-digit chapter code — the taxonomy's own identity, so it gets one
 * treatment everywhere it appears: **primary-25 behind primary-500**, via the
 * semantic `accent-subtle` / `accent` tokens those two colours back.
 *
 * One style, active or not: "inactive" is already said in words beside the code
 * and by the status badge on the detail, so dimming the chip only made the same
 * point a third time — in colour, which is the one cue that cannot be read.
 *
 * It stays a filled square while the sub chapter count is an outlined pill, so
 * the two numbers at either end of a row still read as different kinds of
 * thing: one is a name, the other is a quantity.
 */
function CodeBadge({ code, size = 'sm' }: { code: string; size?: 'sm' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-sm bg-accent-subtle font-bold tabular-nums text-accent
        ${size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs'}`}
    >
      {code}
    </span>
  )
}

/** The quantity: an outlined pill, never the filled square a code gets. */
function CountBadge({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary"
    >
      {n}
    </span>
  )
}

/**
 * Reference Data → ATA Chapters, redesigned from the legacy three screens
 * (Chapters grid, Sub Chapters grid, separate Create forms) into a
 * **master–detail**: every chapter on a rail at the left, the selected
 * chapter's sub chapters at the right.
 *
 * The legacy layout hid the one thing this data *is* — a two-level taxonomy.
 * Chapter and sub chapter lived in separate grids, so "what sub chapters does
 * 25 have?" meant filtering a 617-row list by hand. Here the hierarchy is the
 * navigation: pick a chapter, see its sub chapters; a sub chapter is created
 * from inside its chapter, so the parent is never asked for on a form.
 *
 * The rail carries the full chapter list (the real ATA spec is ~100 chapters)
 * with its own scroll, so the working set stays one glance wide. Search spans
 * chapters *and* sub chapters and lands you on the first matching chapter.
 */
export function AtaChaptersPage({ state = 'ready' }: { state?: PageState }) {
  const chapters = useLookupStore((s) => s.chapters)
  const subChapters = useLookupStore((s) => s.subChapters)
  const addChapter = useLookupStore((s) => s.addChapter)
  const updateChapter = useLookupStore((s) => s.updateChapter)
  const removeChapter = useLookupStore((s) => s.removeChapter)
  const addSubChapter = useLookupStore((s) => s.addSubChapter)
  const updateSubChapter = useLookupStore((s) => s.updateSubChapter)
  const removeSubChapter = useLookupStore((s) => s.removeSubChapter)
  const documents = useDocumentsStore((s) => s.documents)

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [chapterDrawer, setChapterDrawer] = useState<{ mode: 'create' | 'edit'; chapter?: AtaChapter } | null>(null)
  const [sectionDrawer, setSectionDrawer] = useState<{ mode: 'create' | 'edit'; chapter: AtaChapter; section?: AtaSubChapter } | null>(null)
  const [deletingChapter, setDeletingChapter] = useState<AtaChapter | null>(null)
  const [deletingSection, setDeletingSection] = useState<AtaSubChapter | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const loading = state === 'loading'

  const subChaptersOf = (chapterId: string) =>
    subChapters.filter((s) => s.chapterId === chapterId).sort((a, b) => a.sort - b.sort)

  /* Drawing counts no longer appear as a column — they are not in the client's
     list — but they still guard deletion, so a code cannot be deleted out from
     under the drawings filed against it. */
  const drawingsUnderChapter = (code: string) =>
    documents.filter((d) => d.kind === 'drawing' && !!d.ataChapter && (d.ataChapter === code || d.ataChapter.startsWith(`${code}-`))).length
  const drawingsUnderSection = (code: string, section: string) =>
    documents.filter((d) => d.kind === 'drawing' && d.ataChapter === `${code}-${section}`).length

  /** Search spans chapter and sub chapter text; the rail shows what matches. */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const sorted = [...chapters].sort((a, b) => a.sort - b.sort)
    if (!q) return sorted
    return sorted.filter((c) =>
      `${c.chapter} ${c.title} ${c.definition}`.toLowerCase().includes(q)
      || subChaptersOf(c.id).some((s) => `${c.chapter}-${s.section} ${s.title} ${s.definition}`.toLowerCase().includes(q)),
    )
  }, [chapters, subChapters, query]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Selection lives in the URL (?chapter=25) so a chapter is linkable; when
     the search filters the selected chapter away, fall back to the first hit
     without rewriting the URL from under the user. */
  const urlCode = searchParams.get('chapter')
  /* No URL selection: land on the first *active* chapter — the reserved 01–04
     placeholders are a poor first impression of the module. */
  const selected = filtered.find((c) => c.chapter === urlCode)
    ?? filtered.find((c) => c.active)
    ?? filtered[0]
    ?? null
  const select = (c: AtaChapter) => {
    const p = new URLSearchParams(searchParams)
    p.set('chapter', c.chapter)
    setSearchParams(p, { replace: true })
  }

  useEffect(() => {
    railRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [selected?.id])

  const selectedSubChapters = selected ? subChaptersOf(selected.id) : []
  const shownSubChapters = filtered.reduce((n, c) => n + subChaptersOf(c.id).length, 0)

  const activeCount = filtered.filter((c) => c.active).length
  const inactiveCount = filtered.length - activeCount

  const deletingChapterUse = deletingChapter ? drawingsUnderChapter(deletingChapter.chapter) : 0
  const deletingSectionUse = deletingSection && selected ? drawingsUnderSection(selected.chapter, deletingSection.section) : 0

  /* Deleting a chapter or sub chapter that drawings are filed under is refused —
     the dialog's own button retires it instead (standing rule: never orphan). */
  const confirmDeleteChapter = () => {
    if (!deletingChapter) return
    if (deletingChapterUse > 0) {
      updateChapter(deletingChapter.id, { active: false })
      setToast(`Chapter ${deletingChapter.chapter} retired. Drawings keep their codes; it can no longer be picked.`)
    } else {
      removeChapter(deletingChapter.id)
      setToast(`Chapter ${deletingChapter.chapter} deleted.`)
    }
    setDeletingChapter(null)
  }
  const confirmDeleteSection = () => {
    if (!deletingSection || !selected) return
    if (deletingSectionUse > 0) {
      updateSubChapter(deletingSection.id, { active: false })
      setToast(`Sub chapter ${selected.chapter}-${deletingSection.section} retired. Drawings keep their codes.`)
    } else {
      removeSubChapter(deletingSection.id)
      setToast(`Sub chapter ${selected.chapter}-${deletingSection.section} deleted.`)
    }
    setDeletingSection(null)
  }

  if (state === 'error') {
    return (
      <AppShell title="ATA Chapters" activeItem="Reference Data" activeChild="ATA Chapters">
        <Alert title="We couldn't load ATA chapters">Refresh the page, and if it keeps happening, contact your administrator.</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="ATA Chapters"
      description="The taxonomy drawings are filed under."
      activeItem="Reference Data"
      activeChild="ATA Chapters"
      fill
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="ata-search" className="sr-only">Search chapters and sub chapters</label>
            <Input size="sm"
              id="ata-search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code, chapter or sub chapter..." leadingIcon={<Search size={16} />}
            />
          </div>
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setChapterDrawer({ mode: 'create' })}>Add Chapter</Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {/* Same StatCard tiles as every other list page, and they follow the
            search: filter to one chapter and the counts describe that chapter. */}
        <div className="grid shrink-0 gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
          <StatCard value={filtered.length} label="Chapters shown" loading={loading} />
          <StatCard value={shownSubChapters} label="Sub chapters" loading={loading} />
          <StatCard value={activeCount} label="Active chapters" loading={loading} />
          <StatCard value={inactiveCount} label="Inactive chapters" loading={loading} />
        </div>

        {loading ? (
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
            <div className="grid gap-sm overflow-hidden rounded-sm border border-border-default bg-neutral-25 p-lg" style={{ alignContent: 'start' }}>
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
            <div className="grid gap-sm rounded-sm border border-border-default bg-neutral-25 p-lg" style={{ alignContent: 'start' }}>
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<BookOpen size={48} strokeWidth={1.5} />}
              title={query ? 'No chapters or sub chapters match your search' : 'No ATA chapters yet'}
              description={query ? 'Try a code (25), a chapter title or a sub chapter title.' : 'Add the ATA taxonomy drawings will be classified under.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setChapterDrawer({ mode: 'create' })}>Add Chapter</Button>}
            />
          </div>
        ) : (
          /* Both panes end at the fold and scroll inside themselves — the rail
             no longer stops at an arbitrary 520px with dead page under it. */
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
            {/* ------- The chapter rail ------- */}
            <nav aria-label="ATA chapters" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              {/* Labelled once at the top rather than on every row: with the
                  columns named, the code and the count stop competing to be
                  understood and the rows stay short. */}
              <div className="flex shrink-0 items-center gap-sm border-b border-border-default bg-neutral-50 px-base py-sm">
                <span className="w-8 shrink-0 text-xs font-semibold text-text-secondary">No.</span>
                <span className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">Chapter name</span>
                <span className="shrink-0 text-xs font-semibold text-text-secondary">Sub ch.</span>
              </div>
              <div ref={railRef} className="relative min-h-0 flex-1 overflow-y-auto">
                <ul>
                  {filtered.map((c) => {
                    const isSel = c.id === selected?.id
                    const count = subChaptersOf(c.id).length
                    return (
                      <li key={c.id} className="border-b border-border-default last:border-b-0">
                        <button
                          type="button"
                          onClick={() => select(c)}
                          aria-current={isSel ? 'true' : undefined}
                          className={`flex w-full items-center gap-sm border-l-2 px-base py-sm text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                            ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          <CodeBadge code={c.chapter} />
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm ${isSel ? 'font-semibold' : ''} ${c.active ? 'text-text-primary' : 'text-text-muted'}`}>
                              {c.title}
                            </span>
                            {!c.active && <span className="block text-xs text-text-muted">Inactive</span>}
                          </span>
                          <CountBadge n={count} />
                          {/* The badges are decorative; the row's real name is
                              spoken here, counts and state included. */}
                          <span className="sr-only">
                            Chapter {c.chapter}, {c.title}, {count} sub chapter{count === 1 ? '' : 's'}
                            {c.active ? '' : ', inactive'}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </nav>

            {/* ------- The selected chapter ------- */}
            {selected && (
              <section aria-label={`Chapter ${selected.chapter}`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
                {/* Actions behind the 3-dot menu, as every other row in the app. */}
                <header className="flex shrink-0 flex-wrap items-center gap-sm px-lg py-base">
                  <CodeBadge code={selected.chapter} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-text-primary">{selected.title}</h2>
                    <p className="text-xs text-text-secondary">
                      {selectedSubChapters.length} sub chapter{selectedSubChapters.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge tone={selected.active ? 'success' : 'neutral'}>{selected.active ? 'Active' : 'Inactive'}</Badge>
                  <ActionsMenu
                    ariaLabel={`Actions for chapter ${selected.chapter}`}
                    items={[
                      { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setChapterDrawer({ mode: 'edit', chapter: selected }) },
                      { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingChapter(selected), tone: 'danger' },
                    ]}
                  />
                </header>

                <div className="flex shrink-0 items-center justify-between gap-sm border-t border-border-default px-lg py-base">
                  <h3 className="text-sm font-semibold text-text-primary">Sub chapters</h3>
                  <Button size="sm" leadingIcon={<Plus size={14} />}
                    onClick={() => setSectionDrawer({ mode: 'create', chapter: selected })}>
                    Add Sub Chapter
                  </Button>
                </div>

                {selectedSubChapters.length === 0 ? (
                  <p className="border-t border-border-default px-lg py-base text-sm text-text-muted">
                    No sub chapters yet. Most chapters start with 00 — General.
                  </p>
                ) : (
                  <div className="min-h-0 flex-1 overflow-auto border-t border-border-default">
                    <table className="w-full border-collapse text-left" style={{ minWidth: 680 }}>
                      <caption className="sr-only">Sub chapters of chapter {selected.chapter}</caption>
                      <thead>
                        <tr className="border-b border-border-default bg-neutral-50">
                          {SUB_CHAPTER_HEADERS.map((h) => (
                            <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSubChapters.map((s) => (
                            <tr key={s.id} className="border-b border-border-default last:border-b-0">
                              <td className="whitespace-nowrap px-lg py-base text-sm font-semibold tabular-nums text-text-primary">
                                {selected.chapter}-{s.section}
                              </td>
                              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{s.title}</td>
                              <td className="px-lg py-base text-sm text-text-secondary" style={{ maxWidth: 520 }}>
                                <Truncate lines={2}>{s.definition || '—'}</Truncate>
                              </td>
                              <td className="whitespace-nowrap px-lg py-base">
                                <Badge tone={s.active ? 'success' : 'neutral'}>{s.active ? 'Active' : 'Inactive'}</Badge>
                              </td>
                              <td className="px-lg py-base">
                                <ActionsMenu
                                  ariaLabel={`Actions for sub chapter ${selected.chapter}-${s.section}`}
                                  items={[
                                    { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setSectionDrawer({ mode: 'edit', chapter: selected, section: s }) },
                                    { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingSection(s), tone: 'danger' },
                                  ]}
                                />
                              </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {chapterDrawer && (
        <AtaChapterDrawer
          key={chapterDrawer.chapter?.id ?? 'new'}
          mode={chapterDrawer.mode}
          initial={chapterDrawer.chapter}
          onClose={() => setChapterDrawer(null)}
          onSubmit={(c) => {
            if (chapterDrawer.mode === 'edit') updateChapter(c.id, c)
            else { addChapter(c); select(c) }
            setToast(`Chapter ${c.chapter} saved.`)
          }}
        />
      )}
      {sectionDrawer && (
        <AtaSubChapterDrawer
          key={sectionDrawer.section?.id ?? 'new'}
          mode={sectionDrawer.mode}
          chapter={sectionDrawer.chapter}
          initial={sectionDrawer.section}
          onClose={() => setSectionDrawer(null)}
          onSubmit={(s) => {
            if (sectionDrawer.mode === 'edit') updateSubChapter(s.id, s)
            else addSubChapter(s)
            setToast(`Sub chapter ${sectionDrawer.chapter.chapter}-${s.section} saved.`)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingChapter}
        title={deletingChapterUse > 0 ? `Chapter ${deletingChapter?.chapter} is in use` : `Delete chapter ${deletingChapter?.chapter}?`}
        description={deletingChapter
          ? deletingChapterUse > 0
            ? `${deletingChapterUse} drawing${deletingChapterUse === 1 ? ' is' : 's are'} filed under ${deletingChapter.chapter}, so it cannot be deleted without stranding their codes. Retiring it keeps those drawings intact and takes the chapter out of the pickers.`
            : `"${deletingChapter.chapter}: ${deletingChapter.title}" and its ${subChaptersOf(deletingChapter.id).length} sub chapter${subChaptersOf(deletingChapter.id).length === 1 ? '' : 's'} will be permanently removed. This cannot be undone.`
          : ''}
        confirmLabel={deletingChapterUse > 0 ? 'Retire it instead' : 'Delete chapter'}
        tone={deletingChapterUse > 0 ? 'primary' : 'danger'}
        onConfirm={confirmDeleteChapter}
        onCancel={() => setDeletingChapter(null)}
      />
      <ConfirmDialog
        open={!!deletingSection}
        title={deletingSectionUse > 0 ? `Sub chapter ${selected?.chapter}-${deletingSection?.section} is in use` : `Delete sub chapter ${selected?.chapter}-${deletingSection?.section}?`}
        description={deletingSection
          ? deletingSectionUse > 0
            ? `${deletingSectionUse} drawing${deletingSectionUse === 1 ? ' is' : 's are'} filed under this sub chapter. Retiring it keeps them intact and takes the code out of the pickers.`
            : `"${deletingSection.title}" will be permanently removed. This cannot be undone.`
          : ''}
        confirmLabel={deletingSectionUse > 0 ? 'Retire it instead' : 'Delete sub chapter'}
        tone={deletingSectionUse > 0 ? 'primary' : 'danger'}
        onConfirm={confirmDeleteSection}
        onCancel={() => setDeletingSection(null)}
      />
    </AppShell>
  )
}
