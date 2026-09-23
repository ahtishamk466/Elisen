import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon, RemoveFormatting, List, ListOrdered, Indent, Outdent,
  Image as ImageIcon, Table as TableIcon, Link as LinkIcon, Unlink, Undo2, Redo2,
} from 'lucide-react'

export type RichTextToolbar = 'full' | 'compact'

export interface RichTextEditorProps {
  id: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** `full` — every mark plus lists, indent, image and table (DDS Text in the
      legacy portal). `compact` — marks, link and image only (Regulation
      Requirement Text there): fewer structural edits for a field that's
      mostly a pasted-in citation. */
  toolbar?: RichTextToolbar
  disabled?: boolean
  error?: boolean
  /** Labels the editor when there's no visible <label> pointing at it. */
  ariaLabel?: string
}

function ToolbarButton({ label, icon, active, disabled, onClick }: {
  label: string
  icon: ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Mousedown on a toolbar button would otherwise blur the editor first
      // and collapse the text selection, so Bold/Italic/etc. would apply to
      // nothing by the time onClick runs.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-sm p-xs transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary disabled:cursor-not-allowed disabled:opacity-40
        ${active ? 'bg-accent-subtle text-accent' : 'text-text-secondary hover:bg-neutral-100 hover:text-text-primary'}`}
    >
      {icon}
    </button>
  )
}

function ToolbarDivider() {
  return <span aria-hidden className="mx-xxss h-lg w-px shrink-0 bg-border-default" />
}

/**
 * A rich-text field for the two legacy fields that are stored as formatted
 * HTML, not plain text — DDS Text and Regulation Requirement Text — so a
 * pasted-in citation keeps its bold/italic/list structure instead of being
 * flattened to one paragraph the way `Textarea` would flatten it.
 *
 * Built on Tiptap: the toolbar covers the marks and structural edits that
 * actually do something (undo/redo, marks, lists/indent, link, image,
 * table). The legacy editor's cut/copy/paste, fullscreen and Source-view
 * icons are omitted — the browser's own clipboard and zoom already cover
 * them, and a decorative button that doesn't do anything is worse than no
 * button.
 */
export function RichTextEditor({
  id, value, onChange, placeholder = 'Optional…', toolbar = 'full', disabled = false, error = false, ariaLabel,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        id,
        role: 'textbox',
        'aria-multiline': 'true',
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        class: 'rte-content min-h-[8rem] px-base py-sm text-sm outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false })
  }, [value, editor])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  if (!editor) return null

  const setLink = () => {
    const previous = (editor.getAttributes('link').href as string | undefined) ?? ''
    const url = window.prompt('Link URL', previous)
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Image URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div
      className={`overflow-hidden rounded-sm border bg-neutral-25 shadow-textfield transition-colors duration-fast
        ${error ? 'border-danger' : 'border-border-default focus-within:border-text-primary'}
        ${disabled ? 'opacity-40' : ''}`}
    >
      <div role="toolbar" aria-label={`${ariaLabel ?? 'Text'} formatting`} className="flex flex-wrap items-center gap-xxss border-b border-border-default bg-neutral-50 px-sm py-xs">
        <ToolbarButton label="Undo" icon={<Undo2 size={16} aria-hidden />} disabled={disabled || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
        <ToolbarButton label="Redo" icon={<Redo2 size={16} aria-hidden />} disabled={disabled || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
        <ToolbarDivider />
        <ToolbarButton label="Bold" icon={<Bold size={16} aria-hidden />} active={editor.isActive('bold')} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="Italic" icon={<Italic size={16} aria-hidden />} active={editor.isActive('italic')} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="Underline" icon={<UnderlineIcon size={16} aria-hidden />} active={editor.isActive('underline')} disabled={disabled} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <ToolbarButton label="Strikethrough" icon={<Strikethrough size={16} aria-hidden />} active={editor.isActive('strike')} disabled={disabled} onClick={() => editor.chain().focus().toggleStrike().run()} />
        {toolbar === 'full' && (
          <>
            <ToolbarButton label="Subscript" icon={<SubscriptIcon size={16} aria-hidden />} active={editor.isActive('subscript')} disabled={disabled} onClick={() => editor.chain().focus().toggleSubscript().run()} />
            <ToolbarButton label="Superscript" icon={<SuperscriptIcon size={16} aria-hidden />} active={editor.isActive('superscript')} disabled={disabled} onClick={() => editor.chain().focus().toggleSuperscript().run()} />
          </>
        )}
        <ToolbarButton label="Clear formatting" icon={<RemoveFormatting size={16} aria-hidden />} disabled={disabled} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
        <ToolbarDivider />
        {toolbar === 'full' && (
          <>
            <ToolbarButton label="Bullet list" icon={<List size={16} aria-hidden />} active={editor.isActive('bulletList')} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolbarButton label="Numbered list" icon={<ListOrdered size={16} aria-hidden />} active={editor.isActive('orderedList')} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolbarButton label="Decrease indent" icon={<Outdent size={16} aria-hidden />} disabled={disabled || !editor.can().liftListItem('listItem')} onClick={() => editor.chain().focus().liftListItem('listItem').run()} />
            <ToolbarButton label="Increase indent" icon={<Indent size={16} aria-hidden />} disabled={disabled || !editor.can().sinkListItem('listItem')} onClick={() => editor.chain().focus().sinkListItem('listItem').run()} />
            <ToolbarButton label="Insert table" icon={<TableIcon size={16} aria-hidden />} disabled={disabled} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
            <ToolbarDivider />
          </>
        )}
        <ToolbarButton label="Insert link" icon={<LinkIcon size={16} aria-hidden />} active={editor.isActive('link')} disabled={disabled} onClick={setLink} />
        <ToolbarButton label="Remove link" icon={<Unlink size={16} aria-hidden />} disabled={disabled || !editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()} />
        <ToolbarButton label="Insert image" icon={<ImageIcon size={16} aria-hidden />} disabled={disabled} onClick={addImage} />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
