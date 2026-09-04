import { useRef, useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface FileDropzoneProps {
  /** Visible label above the zone, e.g. "Upload File". */
  label: string
  required?: boolean
  /** Accept attribute, e.g. '.sql'. Also enforced on drop. */
  accept?: string
  /** The currently selected file, or null. Controlled by the caller. */
  file: File | null
  onSelect: (file: File | null) => void
  /** Validation message — shown under the zone, which turns danger-bordered. */
  error?: string
  /** Second line inside the zone, e.g. "SQL backup files only (.sql)". */
  hint?: string
  /** Label of the button inside the zone. */
  buttonLabel?: string
}

/** Stacked-files illustration, the client's own asset — decorative, so it's
    hidden from AT. Static (not inlined/recolored) since it carries its own
    drop-shadow filters and layered opacities that a currentColor recolor
    would flatten. */
function FilesIllustration() {
  return <img src="/illustrations/upload-files.svg" alt="" aria-hidden width={180} height={151} className="pointer-events-none select-none" />
}

/**
 * THE file picker for the whole app — every upload uses this, never a bare
 * `<input type="file">`. The "Upload File" button inside the zone is the
 * real, keyboard-reachable control; dropping a file, or clicking anywhere in
 * the zone, are conveniences layered on top of it.
 */
export function FileDropzone({
  label, required, accept, file, onSelect, error, hint, buttonLabel = 'Upload File',
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const accepts = (candidate: File) => {
    if (!accept) return true
    return accept.split(',').some((ext) => candidate.name.toLowerCase().endsWith(ext.trim().toLowerCase()))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    onSelect(dropped && accepts(dropped) ? dropped : null)
  }

  return (
    <div className="grid gap-sm">
      <span className="text-sm font-semibold text-text-primary">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>

      {/* Clicking the zone is a shortcut for the button it contains — the
          button is the accessible control, so the zone itself takes no role
          or tab stop rather than becoming a second, duplicate one. */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-sm rounded-sm border border-dashed px-lg py-3xl text-center transition-colors duration-fast
          ${error
            ? 'border-danger bg-neutral-50'
            : dragging
              ? 'border-accent bg-accent-subtle'
              : 'border-border-default bg-neutral-50'}`}
      >
        <FilesIllustration />
        <p className="text-base font-semibold text-text-primary">Drag &amp; drop a file here, or browse</p>
        {hint && <p className="text-sm text-text-muted">{hint}</p>}
        <div className="mt-base">
          <Button
            type="button"
            leadingIcon={<Upload size={16} />}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={label}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null
          onSelect(picked && accepts(picked) ? picked : null)
          // Let the same file be re-picked after a Remove.
          e.target.value = ''
        }}
      />

      {file && (
        <div className="flex items-center justify-between gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-sm">
          <span className="min-w-0 truncate text-sm text-text-primary">{file.name}</span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-label={`Remove ${file.name}`}
            className="flex shrink-0 items-center gap-xs rounded-sm p-xs text-sm text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            <Trash2 size={16} aria-hidden /> Remove
          </button>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
