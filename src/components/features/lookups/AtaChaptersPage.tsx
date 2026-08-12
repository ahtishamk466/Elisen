import { useMemo, useState } from 'react'
import { Plus, Search, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { AccordionSection } from '@/components/patterns/AccordionSection'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { AtaChapterDrawer } from './AtaChapterDrawer'
import { AtaSubChapterDrawer } from './AtaSubChapterDrawer'
import { useLookupStore } from '@/stores/lookupStore'
import type { AtaChapter, AtaSubChapter } from '@/types/lookup'

export type PageState = 'ready' | 'loading' | 'error'

/** Old "ATA Chapter" + "ATA Sub Chapter" lookup pages merged with the
    Work Package → Activity treatment: each chapter is an expandable card
    with its sections managed inside — see docs/DECISIONS.md. */
export function AtaChaptersPage({ state = 'ready' }: { state?: PageState }) {
  const chapters = useLookupStore((s) => s.chapters)
  const subChapters = useLookupStore((s) => s.subChapters)
  const addChapter = useLookupStore((s) => s.addChapter)
  const updateChapter = useLookupStore((s) => s.updateChapter)
  const removeChapter = useLookupStore((s) => s.removeChapter)
  const addSubChapter = useLookupStore((s) => s.addSubChapter)
  const updateSubChapter = useLookupStore((s) => s.updateSubChapter)
  const removeSubChapter = useLookupStore((s) => s.removeSubChapter)

  const [query, setQuery] = useState('')
  const [chapterDrawer, setChapterDrawer] = useState<{ mode: 'create' | 'edit'; chapter?: AtaChapter } | null>(null)
  const [sectionDrawer, setSectionDrawer] = useState<{ mode: 'create' | 'edit'; chapter: AtaChapter; section?: AtaSubChapter } | null>(null)
  const [deletingChapter, setDeletingChapter] = useState<AtaChapter | null>(null)
  const [deletingSection, setDeletingSection] = useState<AtaSubChapter | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const sectionsOf = (chapterId: string) =>
    subChapters.filter((s) => s.chapterId === chapterId).sort((a, b) => a.sort - b.sort)

  /** Search spans chapter and section text; matching cards auto-expand. */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const sorted = [...chapters].sort((a, b) => a.sort - b.sort)
    if (!q) return sorted
    return sorted.filter((c) =>
      `${c.chapter} ${c.title} ${c.definition}`.toLowerCase().includes(q)
      || sectionsOf(c.id).some((s) => `${c.chapter}-${s.section} ${s.title} ${s.definition}`.toLowerCase().includes(q)),
    )
  }, [chapters, subChapters, query]) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = state === 'loading'
  const iconBtn = 'rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary'

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
      activeItem="Reference Data"
      activeChild="ATA Chapters"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 300 }}>
            <label htmlFor="ata-search" className="sr-only">Search chapters and sections</label>
            <Input
              id="ata-search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chapters or sections..." leadingIcon={<Search size={16} />}
            />
          </div>
          <Button size="lg" leadingIcon={<Plus size={16} />} onClick={() => setChapterDrawer({ mode: 'create' })}>Add Chapter</Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {loading ? (
          <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<BookOpen size={48} strokeWidth={1.5} />}
              title={query ? 'No chapters or sections match your search' : 'No ATA chapters yet'}
              description={query ? 'Try a different chapter or section title.' : 'Add the ATA taxonomy drawings will be classified under.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setChapterDrawer({ mode: 'create' })}>Add Chapter</Button>}
            />
          </div>
        ) : (
          filtered.map((c) => {
            const sections = sectionsOf(c.id)
            return (
              <AccordionSection
                key={`${c.id}-${query.trim() ? 'hit' : 'idle'}`}
                title={`${c.chapter} — ${c.title}`}
                meta={`${sections.length} section${sections.length === 1 ? '' : 's'}${c.active ? '' : ' · Inactive'}`}
                defaultOpen={!!query.trim()}
              >
                <div className="flex items-start justify-between gap-lg">
                  <p className="text-sm text-text-secondary">{c.definition || 'No definition.'}</p>
                  <div className="flex shrink-0 items-center gap-xs">
                    {!c.active && <Badge tone="neutral" dot>Inactive</Badge>}
                    <button type="button" onClick={() => setChapterDrawer({ mode: 'edit', chapter: c })} aria-label={`Edit chapter ${c.chapter}`} className={iconBtn}>
                      <Pencil size={16} aria-hidden />
                    </button>
                    <button type="button" onClick={() => setDeletingChapter(c)} aria-label={`Delete chapter ${c.chapter}`} className={`${iconBtn} hover:text-danger`}>
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="grid gap-sm">
                  {sections.length === 0 && <p className="text-sm text-text-muted">No ata sub chapter in this chapter yet.</p>}
                  {sections.map((s) => (
                    <div key={s.id} className="flex items-start justify-between gap-lg border-t border-border-default pt-sm">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary">
                          {c.chapter}-{s.section} · {s.title}
                          {!s.active && <span className="ml-sm text-xs font-normal text-text-muted">Inactive</span>}
                        </p>
                        {s.definition && <p className="mt-xxss text-xs text-text-muted">{s.definition}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-xs">
                        <button type="button" onClick={() => setSectionDrawer({ mode: 'edit', chapter: c, section: s })} aria-label={`Edit section ${c.chapter}-${s.section}`} className={iconBtn}>
                          <Pencil size={16} aria-hidden />
                        </button>
                        <button type="button" onClick={() => setDeletingSection(s)} aria-label={`Delete section ${c.chapter}-${s.section}`} className={`${iconBtn} hover:text-danger`}>
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSectionDrawer({ mode: 'create', chapter: c })}
                    className="flex w-fit items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    <Plus size={16} aria-hidden /> Add Sub Chapter
                  </button>
                </div>
              </AccordionSection>
            )
          })
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
            else addChapter(c)
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
            setToast(`Section ${sectionDrawer.chapter.chapter}-${s.section} saved.`)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingChapter}
        title="Delete this chapter?"
        description={
          deletingChapter
            ? `"${deletingChapter.chapter} — ${deletingChapter.title}" and its ${sectionsOf(deletingChapter.id).length} section${sectionsOf(deletingChapter.id).length === 1 ? '' : 's'} will be permanently removed. Prefer deactivating to keep history.`
            : ''
        }
        confirmLabel="Delete chapter"
        tone="danger"
        onConfirm={() => { if (deletingChapter) { removeChapter(deletingChapter.id); setToast(`Chapter ${deletingChapter.chapter} deleted.`) } setDeletingChapter(null) }}
        onCancel={() => setDeletingChapter(null)}
      />
      <ConfirmDialog
        open={!!deletingSection}
        title="Delete this section?"
        description={deletingSection ? `Section ${deletingSection.section} — "${deletingSection.title}" will be permanently removed.` : ''}
        confirmLabel="Delete section"
        tone="danger"
        onConfirm={() => { if (deletingSection) { removeSubChapter(deletingSection.id); setToast('Section deleted.') } setDeletingSection(null) }}
        onCancel={() => setDeletingSection(null)}
      />
    </AppShell>
  )
}
